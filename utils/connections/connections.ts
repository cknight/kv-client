import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { deployKvEnvironment, DeployUser } from "./denoDeploy/deployUser.ts";
import { localKv } from "../kv/db.ts";
import { establishKvConnection } from "../kv/kvConnect.ts";
import { getDeployUserData } from "./denoDeploy/deployUser.ts";
import { getUserState } from "../state/state.ts";

export interface Connections {
  local: KvConnection[];
  selfHosted: KvConnection[];
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
  const selfHostedConnections = await getSelfHostedConnections();
  return { local: localConnections, selfHosted: selfHostedConnections, remote };
}

export async function getLocalConnections(): Promise<KvConnection[]> {
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

export async function getSelfHostedConnections(): Promise<KvConnection[]> {
  const start = Date.now();
  const connections: KvConnection[] = [];
  const connectionList = localKv.list<KvConnection>({ prefix: [CONNECTIONS_KEY_PREFIX] });
  for await (const connection of connectionList) {
    if (connection.value.infra === "self-hosted") {
      connections.push(connection.value);
    }
  }
  console.debug(`Loaded ${connections.length} self-hosted connections in ${Date.now() - start}ms`);
  return connections;
}

export async function getKvConnectionDetails(connectionId: string): Promise<KvConnection | null> {
  const conn = await localKv.get<KvConnection>([CONNECTIONS_KEY_PREFIX, connectionId]);
  return conn.value;
}
