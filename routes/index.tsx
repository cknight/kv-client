/// <reference lib="deno.unstable" />
import { Handlers, PageProps } from "$fresh/server.ts";
import { ConnectionCard } from "../components/ConnectionCard.tsx";
import { BUTTON } from "../consts.ts";
import { ConnectButton } from "../islands/ConnectButton.tsx";
import { getUserState } from "../utils/state.ts";

export default function Connections(data: PageProps<string>) {
  const state = getUserState(data);

  return (
    <div class="w-full">
      <div id="localConnections" class="flex p-5">
        <div class="w-40 flex justify-center items-center mr-8">
          <p class="text-2xl font-bold">Local</p>
        </div>
        <div id="localConnectionsList" class="flex flex-wrap max-w-full">
          <ConnectionCard />
          <ConnectionCard />
          <ConnectionCard />
          <ConnectionCard />
          <ConnectionCard />
          <ConnectionCard />
          <ConnectionCard />
          <ConnectionCard />
          <ConnectionCard />
        </div>
      </div>
      <div className="w-full border-b border-gray-400 p-8"></div>
      <div id="remoteConnections" class="flex mt-5">
        <div class="mr-8">
          <p class="text-2xl font-bold">Remote</p>
        </div>
        {state.accessToken
          ? <p>Yey, we have an access token!</p>
          : (
            <div class="flex justify-center items-center w-full h-40">
              <ConnectButton />
            </div>
          )}
      </div>
    </div>
  );
}
