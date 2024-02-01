/// <reference lib="deno.unstable" />
import { RouteContext } from "$fresh/server.ts";
import { ConnectionCard } from "../islands/connections/ConnectionCard.tsx";
import { RemoveLocalConnectionDialog } from "../islands/connections/RemoveLocalConnectionDialog.tsx";
import { AddConnectionButton } from "../islands/connections/AddConnectionButton.tsx";
import { ConnectButton } from "../islands/connections/ConnectButton.tsx";
import { getConnections } from "../utils/connections/connections.ts";
import { signal } from "@preact/signals";

export default async function Connections(_req: Request, ctx: RouteContext) {
  const { local, remote, selfHosted } = await getConnections(ctx.state.session as string);
  const fadeSignal = signal(false);

  return (
    <div class="w-full">
      <div id="localConnections" class="flex p-5">
        <div class="flex justify-center items-center mr-8">
          <p class="w-24 text-2xl font-bold">Local</p>
        </div>
        <div id="localConnectionsList" class="flex flex-wrap w-full">
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
            <AddConnectionButton route="/addLocalConnection" text="Local" />
          </div>
        </div>
      </div>
      <div className="w-full border-b border-gray-400 p-3 mb-8"></div>
      <div id="remoteConnections" class="flex p-5">
        <div class="flex justify-center items-center mr-8">
          <p class="w-24 text-2xl font-bold">Deploy</p>
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
      <div className="w-full border-b border-gray-400 p-3 mb-8"></div>
      <div id="selfHostedConnections" class="flex p-5">
        <div class="flex justify-center items-center mr-8">
          <p class="w-24 text-2xl font-bold">Self-hosted</p>
        </div>
        <div class="flex flex-wrap w-full">
          {selfHosted.length > 0 &&
            selfHosted.map((connection) => (
              <ConnectionCard
                name={connection.name}
                environment={connection.environment}
                location={connection.kvLocation}
                size={connection.size}
                organisation={undefined}
                id={connection.id}
                session={ctx.state.session as string}
              />
            ))}
          <div class="flex justify-around w-full">
            <AddConnectionButton route="/addSelfHostedConnection" text="Self-hosted" />
          </div>
        </div>
      </div>
      <RemoveLocalConnectionDialog />
    </div>
  );
}
