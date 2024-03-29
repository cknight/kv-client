import { Handlers, RouteContext } from "$fresh/server.ts";
import { ListCriteriaBox } from "../islands/list/ListCriteriaBox.tsx";
import { ListResults } from "../islands/list/ListResults.tsx";
import { Environment, KvUIEntry, Stats } from "../types.ts";
import { Partial } from "$fresh/runtime.ts";
import { getConnections, getKvConnectionDetails } from "../utils/connections/connections.ts";
import { getResults, ListInputData } from "../utils/ui/list/listHelper.ts";

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

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();

    const session = ctx.state.session as string;
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
    if (!listInputData.connectionId) {
      return new Response("", {
        status: 303,
        headers: { Location: "/" },
      });
    }

    const searchData = await _internals.getResults(listInputData, session);
    return await ctx.render(searchData);
  },
  async GET(req, ctx) {
    const sp = new URL(req.url).searchParams;
    if (sp.has("prefix")) {
      const session = ctx.state.session as string;
      const connectionId = sp.get("connectionId");

      if (!connectionId) {
        return new Response("", {
          status: 303,
          headers: { Location: "/" },
        });
      }

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
        connectionId,
      };

      const searchData = await _internals.getResults(listInputData, session);

      return await ctx.render(searchData);
    }
    return await ctx.render({} as ListData);
  },
};

export const _internals = {
  getResults,
};

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

  const connectionId = sp.get("connectionId");
  if (!connectionId) {
    console.error("No connection id found");
    return new Response("", {
      status: 400,
      headers: { Location: "/" },
    });
  }

  const connection = await getKvConnectionDetails(connectionId);
  const connectionName = connection?.name || "";
  const connectionLocation = connection?.kvLocation || "";

  const { local, remote, selfHosted } = await getConnections(session);
  const connections: { name: string; id: string; env: Environment }[] = [];
  local.forEach((c) => connections.push({ name: c.name, id: c.id, env: c.environment }));
  remote.forEach((c) => connections.push({ name: c.name, id: c.id, env: c.environment }));
  selfHosted.forEach((c) => connections.push({ name: c.name, id: c.id, env: c.environment }));

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
