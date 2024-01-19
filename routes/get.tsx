import { Handlers, RouteContext } from "$fresh/server.ts";
import { GetCriteriaBox } from "../islands/GetCriteriaBox.tsx";
import { KvUIEntry } from "../types.ts";
import { getUserState } from "../utils/state/state.ts";
import { getKv } from "../utils/kv/kvGet.ts";
import { createKvUIEntry } from "../utils/utils.ts";
import { Partial } from "$fresh/runtime.ts";
import { GetResult } from "../islands/GetResult.tsx";
import { getConnections } from "../utils/connections/connections.ts";

export interface GetData {
  key: string;
  result?: KvUIEntry;
  isPost: boolean;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const key = form.get("kvKey")?.toString() || "";

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

    let resultUIEntry: KvUIEntry | undefined;
    try {
      const cId = connectionId || connection?.id || "";
      const result = await getKv({ session, connectionId: cId, key });
      if (result.versionstamp !== null) {
        resultUIEntry = await createKvUIEntry(result);
      }
    } catch (e) {
      console.error(e);
    }

    return await ctx.render({ key, result: resultUIEntry, isPost: true });
  },
};

export default async function Get(req: Request, props: RouteContext<GetData>) {
  const sp = props.url.searchParams;
  const kvKey = props.data?.key || sp.get("kvKey") || "";
  const connectionId = sp.get("connectionId") || "";
  const isPost = props.data?.isPost || false;
  console.log("GET page load", props.data);

  const session = props.state.session as string;
  const state = getUserState(session);
  const connection = state!.connection;
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
        f-partial="/get"
        class="m-8 mt-0 "
      >
        <Partial name="get">
          <GetCriteriaBox kvKey={kvKey} />
          {isPost && (
            <GetResult
              connectionId={connectionId}
              kvKey={kvKey}
              result={props.data?.result}
              connections={connections}
              connectionLocation={connectionLocation}
            />
          )}
        </Partial>
      </form>
    </>
  );
}
