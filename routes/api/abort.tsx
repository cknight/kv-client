import { Handlers } from "$fresh/server.ts";
import { abort, shouldAbort } from "../../utils/state/state.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = ctx.state.session as string;
    const abortId = await req.text();

    console.debug("Request to abort operation received");
    abort(abortId);

    // Clean up after 10 minutes just in case
    setTimeout(() => {
      shouldAbort(abortId);
    }, 1000 * 60 * 10);

    return new Response("", {
      status: 200,
    });
  },
};
