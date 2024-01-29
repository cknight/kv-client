import { CONNECTIONS_KEY_PREFIX, ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, env } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { deployKvEnvironment, DeployUser } from "./denoDeploy/deployUser.ts";
import { localKv } from "../kv/db.ts";
import { mutex } from "../kv/kvConnect.ts";
import { getEncryptedString } from "../transform/encryption.ts";
import { getDeployUserData } from "./denoDeploy/deployUser.ts";

export interface Connections {
  local: KvConnection[];
  remote: KvConnection[];
}

export async function getConnections(session: string): Promise<Connections> {
  const deployUser: DeployUser | null = await getDeployUserData(session, true);

  const remote: KvConnection[] = [];
  if (deployUser) {
    deployUser.organisations.map((org) => (
      org.projects.map((project) => (
        project.kvInstances.map((instance) => {
          remote.push({
            kvLocation: `https://api.deno.com/databases/${instance.databaseId}/connect`,
            name: project.name,
            environment: deployKvEnvironment(project, instance),
            id: instance.databaseId,
            organisation: org.name || undefined,
            infra: "Deploy",
            size: instance.sizeBytes,
          });
        })
      ))
    ));
  }
  const localConnections = await getLocalConnections();
  return { local: localConnections, remote };
}

async function getLocalConnections(): Promise<KvConnection[]> {
  const start = Date.now();
  const connections: KvConnection[] = [];
  const connectionList = localKv.list<KvConnection>({ prefix: [CONNECTIONS_KEY_PREFIX] });
  for await (const connection of connectionList) {
    if (connection.value.infra === "local") {
      try {
        const fileInfo = await Deno.lstat(connection.value.kvLocation);
        connection.value.size = fileInfo.size;
        connections.push(connection.value);
      } catch (e) {
        console.error(`Failed to load connection ${connection.value.id}: ${e.message}`);
        continue;
      }
    }
  }
  console.debug(`Loaded ${connections.length} local connections in ${Date.now() - start}ms`);
  return connections;
}

/**
 * Establish a secondary KV connection.  This is used for copying data between KV instances.
 *
 * @param session
 * @param destConnectionId
 * @returns Deno.Kv connection (untested)
 */
export async function connectToDestKv(session: string, destConnectionId: string): Promise<Deno.Kv> {
  const conn = await localKv.get<KvConnection>([
    CONNECTIONS_KEY_PREFIX,
    destConnectionId,
  ]);
  const connection: KvConnection | null = conn.value;

  if (!connection) {
    console.error(`Connection ${destConnectionId} does not exist in connections in KV`);
    throw new Error(`Connection ${destConnectionId} does not exist`);
  }

  const location = connection.kvLocation;
  if (connection.infra === "Deploy") {
    const accessToken = await getEncryptedString([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, session]);
    if (!accessToken) {
      console.error("No access token available");
      throw new Error("No access token available");
    }

    /**
     * Prevent access token leakage in a multi-user setting by acquiring a mutex,
     * establishing the connection, and then clearing the access token from the
     * environment variable.  Access token is only required for the initial
     * connection.
     */
    const release = await mutex.acquire();
    Deno.env.set(env.DENO_KV_ACCESS_TOKEN, accessToken);
    const kv = await Deno.openKv(location);
    Deno.env.delete(env.DENO_KV_ACCESS_TOKEN);
    release();

    return kv;
  } else {
    // Local KV file
    try {
      // Check if the file exists (and if it does we assume it is a valid KV file)
      await Deno.lstat(location);
    } catch (_e) {
      console.error(`Connection ${location} does not exist`);
      throw new Error(`Connection ${location} does not exist`);
    }
    return await Deno.openKv(location);
  }
}
