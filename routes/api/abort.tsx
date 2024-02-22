import { Handlers } from "$fresh/server.ts";
import { logDebug } from "../../utils/log.ts";
import { abort } from "../../utils/state/state.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = ctx.state.session as string;
    const abortId = await req.text();

    logDebug({ sessionId: session }, "Request to abort operation received");
    abort(abortId);

    return new Response("", {
      status: 200,
    });
  },
};
