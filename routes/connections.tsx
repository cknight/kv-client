import { Handlers, PageProps } from "$fresh/server.ts";
import { signal } from "@preact/signals";
import { ConnectionList } from "../islands/ConnectionList.tsx";
import { CONNECTIONS_KEY_PREFIX, KvConnection } from "../types.ts";
import { peekAtLocalKvInstances } from "../utils/autoDiscoverKv.ts";
import { getConnections } from "../utils/connections.ts";
import { ulid } from "$std/ulid/mod.ts";
import { connections } from "./_layout.tsx";



export const handler: Handlers = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const kv = await Deno.openKv();

    if (formData.has("connectionName")) {
      const connectionName = formData.get("connectionName")?.toString() || "";
      const kvLocation = formData.get("connectionLocation")?.toString() || "";
      const connectionId = formData.get("connectionId")?.toString() || ulid();
      const connection: KvConnection = {
        name: connectionName,
        kvLocation,
        id: connectionId
      };
      connections.value.push(connection);
      await kv.set([CONNECTIONS_KEY_PREFIX, connection.id], connection);
    } else if (formData.has("connectionAction")) {
      if (formData.get("connectionAction") === "delete") {
        const connectionId = formData.get("connectionId")?.toString() || "";
        const kv = await Deno.openKv();
        await kv.delete([CONNECTIONS_KEY_PREFIX, connectionId]);
        console.log("Deleted connection", connectionId);
      }
    } else {
      console.error("Unrecognized POST data");
    }

    return ctx.render();
  }
};

export default async function Connections() {
  const localKVInstances = await peekAtLocalKvInstances();
  
  return (
    <div>
      <ConnectionList connections={connections} localKvInstances={localKVInstances}/>      
    </div>
  );
}