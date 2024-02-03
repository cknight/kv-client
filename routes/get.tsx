import { FreshContext, Handlers, RouteContext } from "$fresh/server.ts";
import { GetCriteriaBox } from "../islands/GetCriteriaBox.tsx";
import { KvUIEntry } from "../types.ts";
import { getUserState } from "../utils/state/state.ts";
import { getKv } from "../utils/kv/kvGet.ts";
import { createKvUIEntry } from "../utils/utils.ts";
import { Partial } from "$fresh/runtime.ts";
import { GetResult } from "../islands/GetResult.tsx";
import { getConnections } from "../utils/connections/connections.ts";
import { submitGetForm } from "../utils/ui/form.ts";

export interface GetData {
  key: string;
  result?: KvUIEntry;
  error?: string;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const key = form.get("kvKey")?.toString() || "";

    try {
      const kvUiEntry = await getData(key, req, ctx);
      return await ctx.render({ key, result: kvUiEntry });
    } catch (e) {
      return await ctx.render({ key, error: e.message });
    }
  },
  async GET(req, ctx) {
    const urlKvKey = new URL(req.url).searchParams.get("kvKey");
    if (urlKvKey) {
      try {
        const kvUiEntry = await getData(urlKvKey, req, ctx);
        return await ctx.render({ key: urlKvKey, result: kvUiEntry });
      } catch (e) {
        return await ctx.render({ key: urlKvKey, error: e.message });
      }
    }
    return await ctx.render({ key: "" });
  },
};

async function getData(
  kvKey: string,
  req: Request,
  ctx: FreshContext<Record<string, unknown>>,
): Promise<KvUIEntry | undefined> {
  const session = ctx.state.session as string;
  const state = getUserState(session);
  const connection = state!.connection;
  const connectionId = new URL(req.url).searchParams.get("connectionId") || "";

  if (!connection && !connectionId) {
    throw new Error("No connection found");
  }

  let resultUIEntry: KvUIEntry | undefined;
  const cId = connectionId || connection?.id || "";
  const result = await getKv({ session, connectionId: cId, key: kvKey });
  if (result.versionstamp !== null) {
    resultUIEntry = await createKvUIEntry(result);
  }

  return resultUIEntry;
}

export default async function Get(req: Request, props: RouteContext<GetData>) {
  const sp = props.url.searchParams;
  const kvKey = props.data?.key || sp.get("kvKey") || "";
  const error = props.data?.error || "";
  const connectionId = sp.get("connectionId") || "";

  const session = props.state.session as string;
  const state = getUserState(session);
  const connection = state!.connection;
  const connectionLocation = connection?.kvLocation || "";

  const { local, remote, selfHosted } = await getConnections(session);
  const connections: { name: string; id: string; env: string }[] = [];
  local.forEach((c) => connections.push({ name: c.name, id: c.id, env: c.environment }));
  remote.forEach((c) => connections.push({ name: c.name, id: c.id, env: c.environment }));
  selfHosted.forEach((c) => connections.push({ name: c.name, id: c.id, env: c.environment }));

  return (
    <>
      <form
        id="pageForm"
        method="post"
        f-partial="/get"
        class="m-8 mt-0 "
      >
        <Partial name="get">
          <GetCriteriaBox kvKey={kvKey} error={error}/>
          <GetResult
            connectionId={connectionId}
            kvKey={kvKey}
            result={props.data?.result}
            connections={connections}
            connectionLocation={connectionLocation}
          />
        </Partial>
      </form>
    </>
  );
}
