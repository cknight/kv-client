import { Handlers } from "$fresh/server.ts";
import { abortSet } from "../../utils/kv/kvSet.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = ctx.state.session as string;
    const abortId = await req.text();

    console.debug("Request to abort copy operation received");
    abortSet.add(abortId);
    return new Response("", {
      status: 200,
    });
  }
}