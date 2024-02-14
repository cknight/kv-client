import { Handlers } from "$fresh/server.ts";
import { localKv } from "../../utils/kv/db.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";

export interface RemoveConnectionJson {
  connectionId: string;
}

/**
 * API to remove a connection
 */
export const handler: Handlers = {
  async POST(req, _ctx) {
    const value = await req.json() as RemoveConnectionJson;
    try {
      const connectionId = value.connectionId;
      if (connectionId && typeof connectionId === "string") {
        await localKv.delete([CONNECTIONS_KEY_PREFIX, connectionId]);
        console.debug("Removed connection", connectionId);
        return new Response("", {
          status: 200,
        });
      } else {
        return new Response("Invalid connection ID", {
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
