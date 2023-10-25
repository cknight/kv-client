import { CONNECTIONS_KEY_PREFIX } from "../consts.ts";
import { KvConnection } from "../types.ts";
import { localKv } from "./db.ts";

export async function getConnections(): Promise<KvConnection[]> {
  const connections: KvConnection[] = [];
  const connectionList = localKv.list<KvConnection>({ prefix: [CONNECTIONS_KEY_PREFIX] });
  for await (const connection of connectionList) {
    connections.push(connection.value);
  }
  return connections;
}
