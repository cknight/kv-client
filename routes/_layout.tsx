import { FreshContext } from "$fresh/server.ts";
import { HomeIcon } from "../components/svg/Home.tsx";
import { RightArrowIcon } from "../components/svg/RightArrow.tsx";
import { CONNECTIONS_KEY_PREFIX } from "../consts.ts";
import { TabBar } from "../islands/TabBar.tsx";
import { AvatarMenu } from "../islands/avatarMenu/AvatarMenu.tsx";
import { UnknownAvatarMenu } from "../islands/avatarMenu/UnknownAvatarMenu.tsx";
import { KvConnection } from "../types.ts";
import { DeployUser, getDeployUserData } from "../utils/user/denoDeploy/deployUser.ts";
import { localKv } from "../utils/kv/db.ts";
import { getUserState } from "../utils/state/state.ts";

export default async function defineLayout(req: Request, ctx: FreshContext) {
  const tabBarRoutes = ["list", "set", "get", "import", "export"];
  const session = (ctx.state as Record<string, unknown>).session as string;
  let deployUser: DeployUser | null = null;
  if (session) {
    deployUser = await getDeployUserData(session, true);
  }

  const url = new URL(req.url);
  const connectionId = url.searchParams.get("connectionId") || "";
  const connection = await localKv.get<KvConnection>([CONNECTIONS_KEY_PREFIX, connectionId]);
  const connectionName = connection.value?.name;
  const pathParts = url.pathname.split("/");
  const path = url.pathname.length > 1 ? pathParts[1] : "";
  const tabEnabledPath = tabBarRoutes.includes(path);

  function camelToTitleCase(str: string) {
    if (str === "") return "Connections";
    const result = str.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  return (
    <div class="m-4 flex flex-col">
      <nav>
        <div class="navbar rounded p-4 mx-auto bg-gray-700">
          <div class="flex-1">
            <a
              href="/"
              class="text-2xl font-bold cursor-pointer"
              aria-label="Return to connections page"
            >
              <img src="/logo-darkmode.png" class="h-10" alt="KV client logo" />
            </a>
            <a
              href="/"
              class="cursor-pointer flex items-center"
              aria-label="Return to connection page"
            >
              <div class="ml-4">
                <HomeIcon />
              </div>
              <div class="ml-2">
                <RightArrowIcon />
              </div>
              {connectionName &&
                (
                  <>
                    <div class="flex items-center ml-2 text-neutral-300">
                      {connectionName + " (" + (connection.value?.environment) + ")"}
                    </div>
                    <div class="ml-2">
                      <RightArrowIcon />
                    </div>
                  </>
                )}
            </a>
            <div class="flex ml-2 text-neutral-300">{camelToTitleCase(path)}</div>
          </div>
          <div class="flex-none">
            {deployUser !== null
              ? <AvatarMenu deployUser={deployUser} />
              : <UnknownAvatarMenu path={path} />}
          </div>
        </div>
      </nav>

      <main>
        <div class="px-4 py-4 mx-auto w-full">
          <div class="w-full">
            <div class="mx-auto flex flex-col flex-grow items-center justify-center">
              {tabEnabledPath && <TabBar tab={path} connectionId={connectionId} />}
              <div class="w-full">
                <ctx.Component />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
