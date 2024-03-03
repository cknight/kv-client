import { Handlers } from "$fresh/server.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { localKv } from "../../utils/kv/db.ts";
import { logDebug } from "../../utils/log.ts";

export interface RemoveConnectionJson {
  connectionId: string;
}

/**
 * API to remove a connection
 */
export const handler: Handlers = {
  async POST(req, ctx) {
    const value = await req.json() as RemoveConnectionJson;
    const session = ctx.state.session as string;
    try {
      const connectionId = value.connectionId;
      if (connectionId && typeof connectionId === "string") {
        await localKv.delete([CONNECTIONS_KEY_PREFIX, connectionId]);
        logDebug({ sessionId: session }, "Removed connection", connectionId);
        return new Response("", {
          status: 200,
        });
      } else {
        return new Response("Invalid connection id supplied", {
          status: 400,
        });
      }
    } catch (_e) {
      console.error("Failed to remove connection", _e);
      return new Response("Failed to remove connection", {
        status: 500,
      });
    }
  },
};
