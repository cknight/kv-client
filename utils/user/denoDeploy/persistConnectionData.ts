import { CONNECTIONS_KEY_PREFIX } from "../../../consts.ts";
import { KvConnection } from "../../../types.ts";
import { deployKvEnvironment, DeployUser } from "./deployUser.ts";
import { localKv } from "../../kv/db.ts";
import { logError } from "../../log.ts";

export async function persistConnectionData(
  deployUser: DeployUser,
  session: string,
): Promise<void> {
  const keyValues = new Map<Deno.KvKey, unknown>();

  deployUser.organisations.forEach((org) => {
    org.projects.forEach((project) => {
      project.kvInstances.forEach((kvInstance) => {
        const kvConnection: KvConnection = {
          name: project.name,
          id: kvInstance.databaseId,
          infra: "Deploy",
          kvLocation: `https://api.deno.com/databases/${kvInstance.databaseId}/connect`,
          environment: deployKvEnvironment(project, kvInstance),
          size: kvInstance.sizeBytes,
        };
        keyValues.set([CONNECTIONS_KEY_PREFIX, kvInstance.databaseId], kvConnection);
      });
    });
  });

  if (keyValues.size > 0) {
    const atomic = localKv.atomic();
    keyValues.forEach((value, key) => {
      atomic.set(key, value);
    });
    const result = await atomic.commit();
    if (!result.ok) {
      logError({ sessionId: session }, "Failed to save Deploy connections");
    }
  }
}
