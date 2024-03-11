import { Handlers, PageProps } from "$fresh/server.ts";
import { deleteCookie } from "$std/http/cookie.ts";
import { logout } from "../utils/connections/denoDeploy/logout.ts";

interface LogoutProps {
  isDeployUser: boolean;
}

export const handler: Handlers = {
  async POST(_req, ctx) {
    await _internals.logout(ctx.state.session as string);

    const headers = new Headers();
    deleteCookie(headers, "session");

    return new Response("", {
      status: 200,
      headers,
    });
  },
};

export const _internals = {
  logout,
};

export default function Logout(props: PageProps<LogoutProps>) {
  const isDeployUser = new URL(props.url).searchParams.get("authenticated") === "true";
  return (
    <>
      <div class="px-4 py-8 mx-auto">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <h1 class="text-4xl font-bold">{isDeployUser ? "Logged out" : "Data cleared"}</h1>
          <p class="my-4">
            {isDeployUser ? "You have successfully logged out" : "Session data has been deleted"}
          </p>
          <a href="/" class="underline">Go back home</a>
        </div>
      </div>
    </>
  );
}
