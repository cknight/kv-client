import { MultiResult, multiSet } from "kv-utils/mod.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../../consts.ts";
import { KvConnection } from "../../../types.ts";
import { deployKvEnvironment, DeployUser } from "./deployUser.ts";

export async function persistConnectionData(deployUser: DeployUser): Promise<void> {
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
  const result: MultiResult = await multiSet(keyValues);

  if (!result.ok) {
    const failedToInsertKeys = result.failedKeys;
    console.error("Failed to insert keys", failedToInsertKeys);
  }
}
