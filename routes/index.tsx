/// <reference lib="deno.unstable" />
import { Handlers, RouteContext } from "$fresh/server.ts";
import { ConnectionCard } from "../islands/connections/ConnectionCard.tsx";
import { RemoveLocalConnectionDialog } from "../islands/connections/RemoveLocalConnectionDialog.tsx";
import { CONNECTIONS_KEY_PREFIX } from "../consts.ts";
import { AddLocalConnectionButton } from "../islands/connections/AddLocalConnectionButton.tsx";
import { ConnectButton } from "../islands/connections/ConnectButton.tsx";
import { getConnections, resetLocalConnectionList } from "../utils/connections.ts";
import { localKv } from "../utils/kv/db.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const action = formData.get("formAction")?.toString();
    console.log(formData);
    if (action === "removeLocalConnection") {
      const connectionId = formData.get("removeLocalConnectionId")?.toString();
      console.log(connectionId);
      if (connectionId && typeof connectionId === "string") {
        console.log("post check");
        await localKv.delete([CONNECTIONS_KEY_PREFIX, connectionId]);
        await resetLocalConnectionList();
        console.debug("Removed local connection", connectionId);
        return ctx.render();
      }
    }
    return new Response("", {
      status: 400,
      headers: { Location: "/" },
    });
  },
};

export default async function Connections(_req: Request, ctx: RouteContext) {
  const { local, remote } = await getConnections(ctx.state.session as string);

  return (
    <div class="w-full">
      <div id="localConnections" class="flex p-5">
        <div class="flex justify-center items-center mr-8">
          <p class="w-24 text-2xl font-bold">Local</p>
        </div>
        <div id="localConnectionsList" class="flex flex-wrap">
          {local.map((connection) => (
            <ConnectionCard
              name={connection.name}
              environment="local"
              location={connection.kvLocation}
              size={connection.size}
              organisation={undefined}
              id={connection.id}
              session={ctx.state.session as string}
            />
          ))}
          <div class="flex justify-around w-full mt-4">
            <AddLocalConnectionButton />
          </div>
        </div>
      </div>
      <div className="w-full border-b border-gray-400 p-3 mb-8"></div>
      <div id="remoteConnections" class="flex p-5">
        <div class="flex justify-center items-center mr-8">
          <p class="w-24 text-2xl font-bold">Remote</p>
        </div>
        <div class="flex flex-wrap w-full">
          {remote.length > 0
            ? remote.map((connection) => (
              <ConnectionCard
                name={connection.name}
                environment={connection.environment}
                location={connection.kvLocation}
                size={connection.size}
                organisation={connection.organisation}
                id={connection.id}
                session={ctx.state.session as string}
              />
            ))
            : (
              <div class="flex justify-around w-full">
                <ConnectButton />
              </div>
            )}
        </div>
      </div>
      <RemoveLocalConnectionDialog />
    </div>
  );
}
