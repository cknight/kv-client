import { Handlers, PageProps, RouteContext } from "$fresh/server.ts";
import { SearchBox } from "../islands/SearchBox.tsx";
import { PartialSearchResults, SearchData, Stats } from "../types.ts";
import { SearchResults } from "../islands/SearchResults.tsx";
import { searchKv } from "../utils/kv/kvList.ts";
import { PATError } from "../utils/errors.ts";

import { getUserState } from "../utils/state/state.ts";
import { unitsConsumedToday } from "../utils/kv/kvUnitsConsumed.ts";
import { createKvUIEntry } from "../utils/utils.ts";
import { buildResultsPage } from "../utils/ui/buildResultsPage.ts";
import { getConnections } from "../utils/connections/connections.ts";

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
    const disableCache = form.get("disableCache")?.toString() === "on";

    const session = ctx.state.session as string;
    const state = getUserState(session);
    const connection = state!.connection;
    const connectionId = new URL(req.url).searchParams.get("connectionId") || "";

    if (!connection && !connectionId) {
      return new Response("", {
        status: 303,
        headers: { Location: "/" },
      });
    }

    let stats: Stats | undefined;

    let failReason;
    let results: Deno.KvEntry<unknown>[] = [];
    let searchComplete = false;
    try {
      const cId = connectionId || connection?.id || "";
      const searchOptions = {
        session,
        connectionId: cId,
        prefix,
        start,
        end,
        limit,
        reverse,
        disableCache,
      };
      const partialResults = await searchKv(searchOptions);
      results = partialResults.results;
      searchComplete = partialResults.cursor === false;

      await getStats(partialResults);
    } catch (e) {
      if (e instanceof PATError || e instanceof TypeError) {
        failReason = "Issue authorizing with remote connection.  Please sign out and reconnect. " +
          e.message;
        console.error(e);
      } else {
        failReason = e.message || "Unknown error occurred";
        console.error(e);
      }
    }

    const { resultsPage, resultsCount, filtered } = buildResultsPage(filter, results, from, show);
    const resultsToShow = await Promise.all(resultsPage.map(async (e) => await createKvUIEntry(e)));

    const searchData: SearchData = {
      prefix,
      start,
      end,
      limit,
      reverse,
      disableCache,
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

    async function getStats(partialResults: PartialSearchResults) {
      const unitsConsumed = await unitsConsumedToday();
      stats = {
        unitsConsumedToday: unitsConsumed,
        opStats: partialResults.opStats,
        isDeploy: getUserState(session)?.connection?.isRemote || false,
      };
    }
  },
};

export default async function Search(req: Request, props: RouteContext<SearchData>) {
  const sp = props.url.searchParams;
  const prefix = props.data?.prefix || sp.get("prefix") || "";
  const start = props.data?.start || sp.get("start") || "";
  const end = props.data?.end || sp.get("end") || "";
  const limit = props.data?.limit || sp.get("limit") || "10";
  const reverse = props.data?.reverse || (sp.has("reverse") && sp.get("reverse") === "true") ||
    false;
  const disableCache = props.data?.disableCache ||
    (sp.has("disableCache") && sp.get("disableCache") === "true") ||
    false;
  const show = props.data?.show || parseInt(sp.get("show") || "10");
  const from = props.data?.from || parseInt(sp.get("from") || "1");
  const results = props.data?.results;
  const fullResultsCount = props.data?.fullResultsCount || 0;
  const validationError = props.data?.validationError;
  const searchComplete = props.data?.searchComplete || false;
  const filter = props.data?.filter || sp.get("filter") || undefined;
  const filtered = props.data?.filtered || false;

  const session = props.state.session as string;
  const state = getUserState(session);
  const connection = state!.connection;
  const connectionId = connection?.id || "";
  const connectionName = connection?.name || "";
  const connectionLocation = connection?.kvLocation || "";

  const { local, remote } = await getConnections(session);
  const connections: { name: string; id: string; env: string }[] = [];
  local.forEach((c) => connections.push({ name: c.name, id: c.id, env: c.environment }));
  remote.forEach((c) => connections.push({ name: c.name, id: c.id, env: c.environment }));

  return (
    <>
      <form
        id="pageForm"
        xxxf-partial="/partials/results/search?hello=world"
        method="post"
        class="h-full m-8 mt-0 "
      >
        <SearchBox
          prefix={prefix}
          start={start}
          end={end}
          limit={limit}
          validationError={validationError}
          reverse={reverse}
          disableCache={disableCache}
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
          connections={connections}
          connectionId={connectionId}
          connectionName={connectionName}
          connectionLocation={connectionLocation}
        />
      </form>
    </>
  );
}
