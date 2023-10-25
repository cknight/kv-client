import { Handlers } from "$fresh/server.ts";
import { establishKvConnection } from "../../utils/kvConnect.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = ctx.state.session as string;
    try {
      const connection = new URL(req.url).searchParams.get("connection");
      if (connection === null) throw new Error("No connection provided");
      await establishKvConnection(session, connection, "");
    } catch (e) {
      const failReason = e.message || "Unknown error occurred";
      console.error(e);
      return new Response(failReason, { status: 500, headers: { "content-type": "text/plain" } });
    }
    return new Response(undefined, { status: 200 });
  },
};
