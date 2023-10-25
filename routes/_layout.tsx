import { defineLayout } from "$fresh/server.ts";
import { signal } from "@preact/signals";
import { TabBar } from "../islands/TabBar.tsx";
import { KvConnection } from "../types.ts";
import { getConnections } from "../utils/connections.ts";
import { ConnectionDropDown } from "../islands/ConnectionDropDown.tsx";

export const connections = signal<KvConnection[]>([]);

export default defineLayout(async (req: Request, ctx) => {
  connections.value = await getConnections();
  const url = new URL(req.url);
  const path = url.pathname.slice(1);

  return (
    <div class="px-4 py-4 mx-auto">
      <div class="w-full flex justify-between">
        <p class="text-2xl font-bold">KV Client</p>
      </div>
      <div class="mx-auto flex flex-col items-center justify-center">
        <ctx.Component />
      </div>
    </div>
  );
});
