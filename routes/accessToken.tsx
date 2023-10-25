import { Handlers, PageProps } from "$fresh/server.ts";
import { BUTTON } from "../consts.ts";
import { getUserState } from "../utils/state.ts";
import { AccessTokenInput } from "../islands/AccessTokenInput.tsx";
import { buildRemoteData } from "../utils/denoDeploy/deployUser.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const accessToken = formData.get("accessToken");
    if (accessToken && typeof accessToken === "string") {
      if (accessToken.length < 10) {
        return ctx.render({ error: true });
      }

      const start = Date.now();
      const deployUser = await buildRemoteData(accessToken);
      console.log(`[buildRemoteData] ${Date.now() - start}ms`);
      console.log(deployUser);

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
