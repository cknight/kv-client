/// <reference lib="deno.unstable" />
import { Handlers, PageProps } from "$fresh/server.ts";


export const handler: Handlers = {
   GET(_req, ctx) {
    return new Response("", {
      status: 307,
      headers: { Location: "/search" },
    });
  }
}
