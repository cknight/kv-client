import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { localKv } from "../kv/db.ts";
import { DeployUser, deployKvEnvironment } from "./deployUser.ts";
import {
  MultiResult,
  multiSet,
} from "kv-utils/mod.ts";

export async function persistConnectionData(deployUser: DeployUser): Promise<void> {
  const keyValues = new Map<Deno.KvKey, unknown>();

  deployUser.organisations.forEach((org) => {
    org.projects.forEach((project) => {
      project.kvInstances.forEach((kvInstance) => {
        const kvName = project.name + "-" + deployKvEnvironment(project, kvInstance);
        const kvConnection: KvConnection = {
          name: kvName,
          id: kvInstance.databaseId,
          isRemote: true,
          kvLocation: `https://api.deno.com/databases/${kvInstance.databaseId}/connect`,
          size: kvInstance.sizeBytes,
        };
        keyValues.set([CONNECTIONS_KEY_PREFIX, kvInstance.databaseId], kvConnection)
      });
    })
  });
  const result: MultiResult = await multiSet(keyValues);

  if (!result.ok) {
    const failedToInsertKeys = result.failedKeys;
    console.error("Failed to insert keys", failedToInsertKeys);
  }
}