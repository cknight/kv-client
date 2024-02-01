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
  isPost: boolean;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const key = form.get("kvKey")?.toString() || "";

    const kvUiEntry = await getData(key, req, ctx);
    return await ctx.render({ key, result: kvUiEntry, isPost: true });
  },
  async GET(req, ctx) {
    const urlKvKey = new URL(req.url).searchParams.get("kvKey");
    if (urlKvKey) {
      const kvUiEntry = await getData(urlKvKey, req, ctx);
      return await ctx.render({ key: urlKvKey, result: kvUiEntry, isPost: false });
    }
    return await ctx.render({ key: "", isPost: false });
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
  try {
    const cId = connectionId || connection?.id || "";
    const result = await getKv({ session, connectionId: cId, key: kvKey });
    if (result.versionstamp !== null) {
      resultUIEntry = await createKvUIEntry(result);
    }
  } catch (e) {
    console.error(e);
  }
  return resultUIEntry;
}

export default async function Get(req: Request, props: RouteContext<GetData>) {
  const sp = props.url.searchParams;
  const kvKey = props.data?.key || sp.get("kvKey") || "";
  const connectionId = sp.get("connectionId") || "";
  const isPost = props.data?.isPost || false;

  const session = props.state.session as string;
  const state = getUserState(session);
  const connection = state!.connection;
  const connectionName = connection?.name || "";
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
          <GetCriteriaBox kvKey={kvKey} />
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
