import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { localKv } from "../kv/db.ts";
import { logDebug } from "../log.ts";
import { deployKvEnvironment, DeployUser, getDeployUserData } from "../user/denoDeploy/deployUser.ts";

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
  const localConnections = await getLocalConnections(session);
  const selfHostedConnections = await getSelfHostedConnections(session);
  return { local: localConnections, selfHosted: selfHostedConnections, remote };
}

export async function getLocalConnections(session: string): Promise<KvConnection[]> {
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
  logDebug(
    { sessionId: session },
    `Loaded ${connections.length} local connections in ${Date.now() - start}ms`,
  );
  return connections;
}

export async function getSelfHostedConnections(session: string): Promise<KvConnection[]> {
  const start = Date.now();
  const connections: KvConnection[] = [];
  const connectionList = localKv.list<KvConnection>({ prefix: [CONNECTIONS_KEY_PREFIX] });
  for await (const connection of connectionList) {
    if (connection.value.infra === "self-hosted") {
      connections.push(connection.value);
    }
  }
  logDebug(
    { sessionId: session },
    `Loaded ${connections.length} self-hosted connections in ${Date.now() - start}ms`,
  );
  return connections;
}

export async function getKvConnectionDetails(connectionId: string): Promise<KvConnection | null> {
  const conn = await localKv.get<KvConnection>([CONNECTIONS_KEY_PREFIX, connectionId]);
  return conn.value;
}
