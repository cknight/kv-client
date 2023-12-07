import { Handlers } from "$fresh/server.ts";
import { abortSet } from "../../utils/kv/kvDelete.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = ctx.state.session as string;
    const abortId = await req.text();

    console.debug("Request to abort delete operation received");
    abortSet.add(abortId);
    return new Response("", {
      status: 200,
    });
  },
};
