import { Handlers, PageProps } from "$fresh/server.ts";
import { BUTTON, DEPLOY_USER_KEY_PREFIX, ENCRYPTED_USER_ACCESS_TOKEN_PREFIX } from "../consts.ts";
import { getUserState } from "../utils/state.ts";
import { AccessTokenInput } from "../islands/AccessTokenInput.tsx";
import { buildRemoteData } from "../utils/denoDeploy/deployUser.ts";
import { localKv } from "../utils/kv/db.ts";
import { storeEncryptedString } from "../utils/encryption.ts";
import { persistConnectionData } from "../utils/denoDeploy/persistConnectionData.ts";

const _24_HOURS_IN_MS = 1000 * 60 * 60 * 24;

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = ctx.state.session as string;
    const formData = await req.formData();
    const accessToken = formData.get("accessToken");
    if (accessToken && typeof accessToken === "string") {
      if (accessToken.length < 10) {
        return ctx.render({ error: true });
      }

      const start = Date.now();
      const deployUser = await buildRemoteData(accessToken);
      
      console.log(`[buildRemoteData] ${Date.now() - start}ms`);
      
      /* 
       * Store:
       * 1. Deploy user object in KV for 30 days
       * 2. Access token in KV for 30 days
       * 3. Remote connections data indefinitely (will get overwritten on next user connection)
       * 4. Deploy user object in state
       */
      const state = getUserState(ctx);
      await localKv.set([DEPLOY_USER_KEY_PREFIX, session], deployUser, {expireIn: 30*_24_HOURS_IN_MS});
      await storeEncryptedString([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, session], accessToken, 30*_24_HOURS_IN_MS);
      await persistConnectionData(deployUser);
      state.deployUserData = deployUser;

      return new Response("", {
        status: 303,
        headers: { Location: "/" },
      });
    }
    return ctx.render({ error: true });
  },
};

export default function AccessToken(data: PageProps<boolean>) {
  const state = getUserState(data);
  const error = data.data;

  return (
    <div class="w-full bg-white rounded-lg shadow xl:mt-16 sm:max-w-md xl:p-0">
      <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
        <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
          Connect with an access token
        </h1>
        {error && (
          <h2 class="text-lg font-bold p-2 bg-red(400) text-center">
            Invalid access token.
          </h2>
        )}
        <form class="space-y-4 md:space-y-6" action="/accessToken" method="post">
          <div>
            <AccessTokenInput />
          </div>
          <div class="flex justify-center">
            <button
              type="submit"
              class={BUTTON + ""}
            >
              Sign in
            </button>
          </div>
          <p class="text-sm text-gray-500">
            Need an access token?{" "}
            <a
              href="https://dash.deno.com/account#access-tokens"
              class="font-medium text-primary-600 hover:underline ml-2"
              target="_blank"
            >
              Create one
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
