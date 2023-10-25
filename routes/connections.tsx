import { Handlers } from "$fresh/server.ts";
import { ConnectionList } from "../islands/ConnectionList.tsx";
import { CONNECTIONS_KEY_PREFIX } from "../consts.ts";
import { peekAtLocalKvInstances } from "../utils/autoDiscoverKv.ts";
import { ulid } from "$std/ulid/mod.ts";
import { connections } from "./_layout.tsx";
import { KvConnection } from "../types.ts";
import { localKv } from "../utils/kv/db.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const action = formData.get("connectionAction") || "unrecognized";

    if (action === "addEdit") {
      const connectionName = formData.get("connectionName")?.toString() || "";
      const kvLocation = formData.get("connectionLocation")?.toString() || "";
      const connectionId = formData.get("connectionId")?.toString() || ulid();
      const connection: KvConnection = {
        name: connectionName,
        kvLocation,
        id: connectionId,
      };
      const isDuplicate =
        connections.value.filter((c) => (c.kvLocation === kvLocation && c.name === connectionName))
          .length > 0;
      if (!isDuplicate) {
        connections.value.push(connection);
        await localKv.set([CONNECTIONS_KEY_PREFIX, connection.id], connection);
      }
    } else if (action === "delete") {
      const connectionId = formData.get("connectionId")?.toString() || "";
      await localKv.delete([CONNECTIONS_KEY_PREFIX, connectionId]);
      console.debug("Deleted connection", connectionId);
    } else {
      console.error("Unrecognized POST data");
    }

    return ctx.render();
  },
};

export default async function Connections() {
  const localKVInstances = await peekAtLocalKvInstances();

  return (
    <div>
      <ConnectionList connections={connections} localKvInstances={localKVInstances} />
    </div>
  );
}
