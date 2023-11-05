import { defineLayout, LayoutContext } from "$fresh/server.ts";
import { signal } from "@preact/signals";
import { KvConnection } from "../types.ts";
import { getLocalConnections } from "../utils/connections.ts";
import { getUserState } from "../utils/state.ts";
import { DeployUser } from "../utils/denoDeploy/deployUser.ts";
import { localKv } from "../utils/kv/db.ts";
import { DEPLOY_USER_KEY_PREFIX } from "../consts.ts";
import { GitHubIcon } from "../components/svg/GitHub.tsx";
import { AvatarMenu } from "../islands/AvatarMenu.tsx";

export const connections = signal<KvConnection[]>([]);

export default defineLayout(async (req: Request, ctx: LayoutContext<void, unknown>) => {
  connections.value = await getLocalConnections();
  const start = Date.now();
  const state = getUserState(ctx);
  let deployUser: DeployUser | null = state.deployUserData;
  if (!deployUser) {
    const session = (ctx.state as Record<string, unknown>).session as string;

    if (session) {
      deployUser = (await localKv.get<DeployUser>([
        DEPLOY_USER_KEY_PREFIX,
        session,
      ])).value;
    }
  }

  return (
    <div class="px-4 py-4 mx-auto">
      <div class="w-full flex justify-between">
        <a href="/" class="text-2xl font-bold cursor-pointer">KV Client</a>
        {deployUser && <AvatarMenu deployUser={deployUser} hello="world2" />}
      </div>
      <div class="mx-auto flex flex-col items-center justify-center">
        <ctx.Component />
      </div>
    </div>
  );
});
