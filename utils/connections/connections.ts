import { CONNECTIONS_KEY_PREFIX, DEPLOY_USER_KEY_PREFIX, ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, env } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { deployKvEnvironment, DeployUser } from "./denoDeploy/deployUser.ts";
import { localKv } from "../kv/db.ts";
import { getUserState } from "../state/state.ts";
import { mutex } from "../kv/kvConnect.ts";
import { getEncryptedString } from "../transform/encryption.ts";

export interface Connections {
  local: KvConnection[];
  remote: KvConnection[];
}

export const localConnections = await getLocalConnections();

export async function getConnections(session: string): Promise<Connections> {
  const state = getUserState(session);

  let deployUser: DeployUser | null = state.deployUserData;
  if (!deployUser) {
    deployUser = (await localKv.get<DeployUser>([DEPLOY_USER_KEY_PREFIX, session])).value;
    state.deployUserData = deployUser;
  }

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
            isRemote: true,
            size: instance.sizeBytes,
          });
        })
      ))
    ));
  }

  return { local: localConnections, remote };
}

export async function resetLocalConnectionList(): Promise<void> {
  localConnections.length = 0;
  localConnections.push(...await getLocalConnections());
}

async function getLocalConnections(): Promise<KvConnection[]> {
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
  if (connection.isRemote) {
    // Remote KV access
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
