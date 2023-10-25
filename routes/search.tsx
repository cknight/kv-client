import { Handlers, PageProps } from "$fresh/server.ts";
import { Signal } from "@preact/signals";
import { SearchBox } from "../islands/SearchBox.tsx";
import { KvUIEntry, SearchData, Stats } from "../types.ts";
import { SearchResults } from "../islands/SearchResults.tsx";
import { searchKv } from "../utils/kvSearch.ts";
import { SearchForm } from "../islands/PageForm.tsx";
import { PATError } from "../utils/errors.ts";
import { getUserState } from "../utils/state.ts";
import { unitsConsumedToday } from "../utils/kvUnitsConsumed.ts";
import { createKvUIEntry } from "../utils/utils.ts";
import { establishKvConnection } from "../utils/kvConnect.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const prefix = form.get("prefix")?.toString() || "";
    const start = form.get("start")?.toString() || "";
    const end = form.get("end")?.toString() || "";
    const limit = form.get("limit")?.toString() || "";
    const reverse = form.get("reverse")?.toString() === "on";
    const from = parseInt(form.get("from")?.toString() || "1");
    const show = parseInt(form.get("show")?.toString() || "10");
    const pat = form.get("pat")?.toString() || "";
    const filter = form.get("filter")?.toString() || undefined;

    const session = ctx.state.session as string;
    const state = getUserState(session);
    const connection = state!.connection;
    if (!connection) {
      const connectionId = new URL(req.url).searchParams.get("connection") || "";
      establishKvConnection(session, connectionId, pat);
    }

    let patRequired = false;
    let stats: Stats | undefined;

    let failReason;
    const results: Deno.KvEntry<unknown>[] = [];
    let searchComplete = false;
    try {
      const connectionId = connection?.id || "";

      //FIXME - break connection out from search.  Needs established prior to search
      //e.g. search shouldn't load without valid connection
      const searchOptions = {
        session,
        connection: connectionId,
        pat,
        prefix,
        start,
        end,
        limit,
        reverse,
      };
      const partialResults = await searchKv(searchOptions);
      results.push(...partialResults.results);
      searchComplete = partialResults.cursor === false;

      //TODO - maybe only for requests to Deploy?
      const unitsConsumed = await unitsConsumedToday();
      stats = {
        unitsConsumedToday: unitsConsumed,
        opStats: partialResults.opStats,
        isDeploy: getUserState(session)?.connectionIsDeploy || false,
      };
    } catch (e) {
      if (e instanceof PATError) {
        failReason = e.message;
        patRequired = true;
      } else if (e instanceof TypeError) {
        //invalid PAT error from Deploy
        const state = getUserState(ctx.state.session as string);
        if (state) {
          state.accessToken = undefined;
        }
        failReason = e.message;
        patRequired = true;
      } else {
        failReason = e.message || "Unknown error occurred";
        console.error(e);
      }
    }

    const kvUIEntries: KvUIEntry[] = results.map((e) => createKvUIEntry(e));

    const searchData: SearchData = {
      prefix,
      start,
      end,
      limit,
      reverse,
      results: kvUIEntries,
      filter,
      show,
      from,
      pat,
      patRequired,
      searchComplete,
      validationError: failReason,
      stats,
    };

    return await ctx.render(searchData);
  },
};

export default function Search(props: PageProps<SearchData>) {
  const sp = props.url.searchParams;
  const prefix = props.data?.prefix || sp.get("prefix") || "";
  const start = props.data?.start || sp.get("start") || "";
  const end = props.data?.end || sp.get("end") || "";
  const limit = props.data?.limit || sp.get("limit") || "10";
  const reverse = props.data?.reverse || (sp.has("reverse") && sp.get("reverse") === "true") ||
    false;
  const show = props.data?.show || parseInt(sp.get("show") || "10");
  const from = props.data?.from || parseInt(sp.get("from") || "1");
  const results = props.data?.results;
  const validationError = props.data?.validationError;
  const searchComplete = props.data?.searchComplete || false;
  const patRequired = props.data?.patRequired || false;
  const filter = props.data?.filter || sp.get("filter") || undefined;

  return (
    <>
      <SearchForm>
        <SearchBox
          prefix={prefix}
          start={start}
          end={end}
          limit={limit}
          validationError={validationError}
          patRequired={patRequired}
          reverse={reverse}
        />
        <SearchResults
          results={results}
          show={show}
          from={from}
          filter={filter}
          searchComplete={searchComplete}
          stats={props.data?.stats}
          session={props.state.session as string}
          prefix={prefix}
          start={start}
          end={end}
          reverse={reverse}
        />
      </SearchForm>
    </>
  );
}
