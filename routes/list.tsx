import { Handlers, RouteContext } from "$fresh/server.ts";
import { ListCriteriaBox } from "../islands/ListCriteriaBox.tsx";
import { KvConnection, KvUIEntry, PartialListResults, Stats } from "../types.ts";
import { ListResults } from "../islands/ListResults.tsx";
import { listKv } from "../utils/kv/kvList.ts";

import { getUserState } from "../utils/state/state.ts";
import { unitsConsumedToday } from "../utils/kv/kvUnitsConsumed.ts";
import { createKvUIEntry } from "../utils/utils.ts";
import { buildResultsPage } from "../utils/ui/buildResultsPage.ts";
import { getConnections } from "../utils/connections/connections.ts";
import { Partial } from "$fresh/runtime.ts";

export interface ListData {
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
  disableCache: boolean;
  show: number;
  from: number;
  results?: KvUIEntry[];
  fullResultsCount: number;
  filter: string | undefined;
  filtered: boolean;
  listComplete: boolean;
  validationError?: string;
  stats?: Stats;
}

interface ListInputData {
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
  from: number;
  show: number;
  filter: string | undefined;
  disableCache: boolean;
  connectionId: string;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();

    const session = ctx.state.session as string;
    const state = getUserState(session);
    const connection = state!.connection;

    const listInputData: ListInputData = {
      prefix: form.get("prefix")?.toString() || "",
      start: form.get("start")?.toString() || "",
      end: form.get("end")?.toString() || "",
      limit: form.get("limit")?.toString() || "",
      reverse: form.get("reverse")?.toString() === "on",
      from: parseInt(form.get("from")?.toString() || "1"),
      show: parseInt(form.get("show")?.toString() || "10"),
      filter: form.get("filter")?.toString() || undefined,
      disableCache: form.get("disableCache")?.toString() === "on",
      connectionId: new URL(req.url).searchParams.get("connectionId") || "",
    };

    if (!connection && !listInputData.connectionId) {
      return new Response("", {
        status: 303,
        headers: { Location: "/" },
      });
    }

    const searchData = await getResults(listInputData, session, connection);

    return await ctx.render(searchData);
  },
  async GET(req, ctx) {
    const sp = new URL(req.url).searchParams;
    if (sp.has("prefix")) {
      const session = ctx.state.session as string;
      const state = getUserState(session);
      const connection = state!.connection;
  
      const listInputData: ListInputData = {
        prefix: sp.get("prefix") || "",
        start: sp.get("start") || "",
        end: sp.get("end") || "",
        limit: sp.get("limit") || "",
        reverse: sp.get("reverse") === "true",
        from: parseInt(sp.get("from") || "1"),
        show: parseInt(sp.get("show") || "10"),
        filter: sp.get("filter") || undefined,
        disableCache: sp.get("disableCache") === "true",
        connectionId: sp.get("connectionId") || "",
      };
  
      if (!connection && !listInputData.connectionId) {
        return new Response("", {
          status: 303,
          headers: { Location: "/" },
        });
      }
  
      const searchData = await getResults(listInputData, session, connection);
  
      return await ctx.render(searchData);
    }
    return await ctx.render({} as ListData);
  },
};

async function getStats(session: string, partialResults: PartialListResults): Promise<Stats> {
  const unitsConsumed = await unitsConsumedToday();
  return {
    unitsConsumedToday: unitsConsumed,
    opStats: partialResults.opStats,
    isDeploy: getUserState(session)?.connection?.infra === "Deploy" || false,
  };
}

async function getResults(
  listInputData: ListInputData,
  session: string,
  connection: KvConnection | null,
): Promise<ListData> {
  let failReason;
  let results: Deno.KvEntry<unknown>[] = [];
  let listComplete = false;
  let stats: Stats | undefined;
  try {
    const cId = listInputData.connectionId || connection?.id || "";
    const searchOptions = {
      session,
      connectionId: cId,
      prefix: listInputData.prefix,
      start: listInputData.start,
      end: listInputData.end,
      limit: listInputData.limit,
      reverse: listInputData.reverse,
      disableCache: listInputData.disableCache,
    };
    const partialResults = await listKv(searchOptions);
    results = partialResults.results;
    listComplete = partialResults.cursor === false;

    stats = await getStats(session, partialResults);
  } catch (e) {
    if (e instanceof TypeError) {
      failReason = "Issue authorizing with remote connection.  Please sign out and reconnect. " +
        e.message;
      console.error(e);
    } else {
      failReason = e.message || "Unknown error occurred";
      console.error(e);
    }
  }

  const { resultsPage, resultsCount, filtered } = buildResultsPage(
    listInputData.filter,
    results,
    listInputData.from,
    listInputData.show,
  );
  const resultsToShow = await Promise.all(resultsPage.map(async (e) => await createKvUIEntry(e)));

  const searchData: ListData = {
    ...listInputData,
    results: resultsToShow,
    fullResultsCount: resultsCount,
    filtered,
    listComplete,
    validationError: failReason,
    stats,
  };
  return searchData;
}

export default async function List(req: Request, props: RouteContext<ListData>) {
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
  const searchComplete = props.data?.listComplete || false;
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
        method="post"
        f-partial="/list"
        class="m-8 mt-0 "
      >
        <Partial name="list">
          <ListCriteriaBox
            prefix={prefix}
            start={start}
            end={end}
            limit={limit}
            validationError={validationError}
            reverse={reverse}
            disableCache={disableCache}
          />
          <ListResults
            results={results}
            resultsCount={fullResultsCount}
            show={show}
            from={from}
            filter={filter}
            filtered={filtered}
            listComplete={searchComplete}
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
        </Partial>
      </form>
    </>
  );
}
