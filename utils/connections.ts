import { CONNECTIONS_KEY_PREFIX } from "../consts.ts";
import { KvConnection } from "../types.ts";
import { localKv } from "./kv/db.ts";

export async function getLocalConnections(): Promise<KvConnection[]> {
  const connections: KvConnection[] = [];
  const connectionList = localKv.list<KvConnection>({ prefix: [CONNECTIONS_KEY_PREFIX] });
  for await (const connection of connectionList) {
    if (connection.value.isRemote) continue;
    try {
      const fileInfo = await Deno.lstat(connection.value.kvLocation);
      connection.value.size = fileInfo.size;
      connections.push(connection.value);
    } catch (e) {
      console.error(`Failed to load connection ${connection.value.id}: ${e.message}`);
      continue;
    }
  }
  return connections;
}
