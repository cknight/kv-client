import { PageProps } from "$fresh/server.ts";
import { ConnectionList } from "../islands/ConnectionList.tsx";
import { CONNECTIONS_KEY_PREFIX, KvConnection } from "../types.ts";

export default async function Connections(data: PageProps<string>) {
  const kv = await Deno.openKv();
  const connectionList = kv.list<KvConnection>({prefix: [CONNECTIONS_KEY_PREFIX]});
  const connections: KvConnection[] = [];
  for await (const connection of connectionList) {
    connections.push(connection.value);
  }
  connections.push({
    name: "Local KV",
    kvLocation: "/home/chris/.cache/deno/location_data/b958a7b6616019fada6dc92805fdb95b1f7de6bd338b9b2a67bbc6cbe39a7eef/kv.sqlite3",
    id: "b958a7b6616019fada6dc92805fdb95b1f7de6bd338b9b2a67bbc6cbe39a7eef"
  });

  return (
    <div>
      <ConnectionList connections={connections}/>      
    </div>
  );
}