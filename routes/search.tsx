import { Handlers, PageProps } from "$fresh/server.ts";
import { Signal } from "@preact/signals";
import { SearchBox } from "../islands/SearchBox.tsx";
import { KvUIEntry, SearchData, Stats } from "../types.ts";
import { SearchResults } from "../islands/SearchResults.tsx";
import { searchKv } from "../utils/kv/kvSearch.ts";
import { SearchForm } from "../islands/PageForm.tsx";
import { PATError } from "../utils/errors.ts";
import { getUserState } from "../utils/state.ts";
import { unitsConsumedToday } from "../utils/kv/kvUnitsConsumed.ts";
import { createKvUIEntry } from "../utils/utils.ts";
import { establishKvConnection } from "../utils/kv/kvConnect.ts";

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
    const filter = form.get("filter")?.toString() || undefined;

    const session = ctx.state.session as string;
    const state = getUserState(session);
    const connection = state!.connection;
    const connectionId = new URL(req.url).searchParams.get("connection") || "";
    if (!connection && !connectionId) {
      return new Response("", {
        status: 303,
        headers: { Location: "/" },
      });
    }

    let stats: Stats | undefined;

    let failReason;
    const results: Deno.KvEntry<unknown>[] = [];
    let searchComplete = false;
    try {
      const cId = connectionId || connection?.id || "";
      const searchOptions = {
        session,
        connection: cId,
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
        isDeploy: getUserState(session)?.connection?.isRemote || false,
      };
    } catch (e) {
      if (e instanceof PATError || e instanceof TypeError) {
        failReason =
          "Issue authorizing with remote connection.  Please sign out and reconnect. " +
          e.message;
        console.error(e);
      } else {
        failReason = e.message || "Unknown error occurred";
        console.error(e);
      }
    }

    const startms = Date.now();
    let resultsToShow: KvUIEntry[] = [];
    let resultsCount = results.length;
    let filtered = false;
    if (filter !== undefined && filter !== "") {
      const kvUIEntries: KvUIEntry[] = results.map((e) => createKvUIEntry(e));
      resultsToShow = kvUIEntries?.filter((e) =>
        e.key.includes(filter) ||
        e.fullValue?.includes(filter)
      );
      resultsCount = resultsToShow.length;
      resultsToShow = resultsToShow.slice(from - 1, from - 1 + show);
      filtered = true;
    } else {
      const resultsPage = results.slice(from - 1, from - 1 + show);
      resultsToShow = resultsPage.map((e) => createKvUIEntry(e));
    }
    console.log(`kvUIEntries took ${Date.now() - startms}ms`);
  

    const searchData: SearchData = {
      prefix,
      start,
      end,
      limit,
      reverse,
      results: resultsToShow,
      fullResultsCount: resultsCount,
      filter,
      filtered,
      show,
      from,
      searchComplete,
      validationError: failReason,
      stats,
    };

    return await ctx.render(searchData);
  },
  async GET(req, ctx) {
    const searchParms = new URL(req.url).searchParams;
    const connectionId = searchParms.get("connectionId") || "";

    if (connectionId) {
      try {
        const session = ctx.state.session as string;
        await establishKvConnection(session, connectionId);
      } catch (e) {
        //FIXME: show error to user
        console.error(`Failed to connect to ${connectionId}. Error: `, e);
      }
    }
    return ctx.render();
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
  const fullResultsCount = props.data?.fullResultsCount || 0;
  const validationError = props.data?.validationError;
  const searchComplete = props.data?.searchComplete || false;
  const filter = props.data?.filter || sp.get("filter") || undefined;
  const filtered = props.data?.filtered || false;

  return (
    <>
      <SearchForm>
        <SearchBox
          prefix={prefix}
          start={start}
          end={end}
          limit={limit}
          validationError={validationError}
          reverse={reverse}
        />
        <SearchResults
          results={results}
          resultsCount={fullResultsCount}
          show={show}
          from={from}
          filter={filter}
          filtered={filtered}
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
