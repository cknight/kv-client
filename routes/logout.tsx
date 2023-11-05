import { Handlers } from "$fresh/server.ts";
import { deleteCookie, setCookie } from "$std/http/cookie.ts";
import { logout } from "../utils/denoDeploy/logout.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    await logout(ctx.state.session as string);

    const headers = new Headers();
    deleteCookie(headers, "session");
    setCookie(headers, { name: "Location", value: "/logout"});

    return new Response("", {
      status: 303,
      headers: headers,
    });
  },
};

export default function Logout() {
  return (
    <>
      <div class="px-4 py-8 mx-auto">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <h1 class="text-4xl font-bold">Logged out</h1>
          <p class="my-4">
            You have successfully logged out
          </p>
          <a href="/" class="underline">Go back home</a>
        </div>
      </div>
    </>
  );
}
