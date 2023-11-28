import { CONNECTIONS_KEY_PREFIX, DEPLOY_USER_KEY_PREFIX } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { deployKvEnvironment, DeployUser } from "./denoDeploy/deployUser.ts";
import { localKv } from "../kv/db.ts";
import { getUserState } from "../state/state.ts";

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
