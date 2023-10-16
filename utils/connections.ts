import { CONNECTIONS_KEY_PREFIX } from "../consts.ts";
import { KvConnection } from "../types.ts";

export async function getConnections(): Promise<KvConnection[]> {
  const connections: KvConnection[] = [];
  const kv = await Deno.openKv();
  const connectionList = kv.list<KvConnection>({prefix: [CONNECTIONS_KEY_PREFIX]});
  for await (const connection of connectionList) {
    connections.push(connection.value);
  }
  return connections;
}