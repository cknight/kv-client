import { Handlers, PageProps } from "$fresh/server.ts";
import { DEPLOY_USER_KEY_PREFIX, ENCRYPTED_USER_ACCESS_TOKEN_PREFIX } from "../consts.ts";
import { getUserState } from "../utils/state/state.ts";
import { AccessTokenInput } from "../islands/AccessTokenInput.tsx";
import { buildRemoteData } from "../utils/connections/denoDeploy/deployUser.ts";
import { localKv } from "../utils/kv/db.ts";
import { storeEncryptedString } from "../utils/transform/encryption.ts";
import { persistConnectionData } from "../utils/connections/denoDeploy/persistConnectionData.ts";

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

      /*
       * Store:
       * 1. Deploy user object in KV for 1 day
       * 2. Access token in KV for 30 days (TODO is this a sensible default?)
       * 3. Remote connections data indefinitely (will get overwritten on next user connection)
       * 4. Deploy user object in state
       */
      const state = getUserState(ctx);
      await localKv.set([DEPLOY_USER_KEY_PREFIX, session], deployUser, {
        expireIn: _24_HOURS_IN_MS,
      });
      await storeEncryptedString(
        [ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, session],
        accessToken,
        30 * _24_HOURS_IN_MS,
      );
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

  //<div class="w-full bg-white rounded-lg shadow sm:max-w-md">
  return (
    <div class="h-full flex items-center justify-center">
      <div class="card w-full sm:max-w-md shadow">
        <div class="card-body">
          <h1 class="card-title">Connect with an access token</h1>
          {error && (
            <h2 class="text-lg font-bold p-2 bg-red-400 text-center">
              Invalid access token.
            </h2>
          )}
          <form class="space-y-4 md:space-y-6" action="/accessToken" f-client-nav={false} method="post">
            <div>
              <AccessTokenInput />
            </div>
            <div class="flex justify-center">
              <button
                type="submit"
                class="btn btn-primary"
              >
                Sign in
              </button>
            </div>
            <p class="text-sm ">
              Need an access token?{" "}
              <a
                href="https://dash.deno.com/account#access-tokens"
                class="font-medium text-primary-600 underline ml-2"
                target="_blank"
              >
                Create one
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
