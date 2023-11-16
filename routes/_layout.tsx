import { defineLayout, LayoutContext } from "$fresh/server.ts";
import { KvConnection } from "../types.ts";
import { getUserState } from "../utils/state.ts";
import { DeployUser } from "../utils/denoDeploy/deployUser.ts";
import { localKv } from "../utils/kv/db.ts";
import { CONNECTIONS_KEY_PREFIX, DEPLOY_USER_KEY_PREFIX } from "../consts.ts";
import { AvatarMenu } from "../islands/avatarMenu/AvatarMenu.tsx";
import { HomeIcon } from "../components/svg/Home.tsx";
import { RightArrowIcon } from "../components/svg/RightArrow.tsx";
import { UnknownAvatarMenu } from "../islands/avatarMenu/UnknownAvatarMenu.tsx";

export default defineLayout(async (req: Request, ctx: LayoutContext<void, unknown>) => {
  const state = getUserState(ctx);
  const session = (ctx.state as Record<string, unknown>).session as string;
  let deployUser: DeployUser | null = state.deployUserData;
  if (!deployUser) {
    if (session) {
      deployUser = (await localKv.get<DeployUser>([
        DEPLOY_USER_KEY_PREFIX,
        session,
      ])).value;
      state.deployUserData = deployUser;
    }
  }
  const url = new URL(req.url);
  const connectionId = url.searchParams.get("connectionId") || "";
  const connection = await localKv.get<KvConnection>([CONNECTIONS_KEY_PREFIX, connectionId]);
  const connectionName = connection.value?.name;
  const pathParts = url.pathname.split("/");
  const path = url.pathname.length > 1 ? pathParts[1] : "Connections";

  function camelToTitleCase(str: string) {
    const result = str.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  return (
    <div class="px-4 py-4 mx-auto">
      <div class="w-full flex justify-between border-b-2 p-4 shadow bg-white">
        <div class="flex items-center">
          <a href="/" class="text-2xl font-bold cursor-pointer">
            <img src="/logo.png" class="h-10" />
          </a>
          <a href="/" class="cursor-pointer flex items-center">
            <div class="ml-4">
              <HomeIcon />
            </div>
            <div class="ml-2">
              <RightArrowIcon />
            </div>
            {connectionName &&
              (
                <>
                  <div class="flex items-center ml-2 text-[#6e6e6e]">
                    {connectionName + " (" + (connection.value?.environment) + ")"}
                  </div>
                  <div class="ml-2">
                    <RightArrowIcon />
                  </div>
                </>
              )}
          </a>
          <div class="flex ml-2 text-[#6e6e6e]">{camelToTitleCase(path)}</div>
        </div>
        {deployUser ? <AvatarMenu deployUser={deployUser} /> : <UnknownAvatarMenu />}
      </div>
      <div class="mx-auto flex flex-col items-center justify-center">
        <ctx.Component />
      </div>
    </div>
  );
});
