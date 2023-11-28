import { Handlers } from "$fresh/server.ts";
import { CONNECTIONS_KEY_PREFIX, ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, env } from "../../consts.ts";
import { CopyAuditLog, KvConnection } from "../../types.ts";
import { executorId } from "../../utils/connections/denoDeploy/deployUser.ts";
import { getEncryptedString } from "../../utils/transform/encryption.ts";
import { localKv } from "../../utils/kv/db.ts";
import { auditAction, auditConnectionName } from "../../utils/kv/kvAudit.ts";
import { establishKvConnection, mutex } from "../../utils/kv/kvConnect.ts";
import { setAll, SetResult } from "../../utils/kv/kvSet.ts";
import { getUserState } from "../../utils/state/state.ts";
import { entriesToOperateOn, KeyOperationData } from "../../utils/ui/buildResultsPage.ts";

export interface CopyKeysData {
  sourceConnectionId: string;
  destConnectionId: string;
  keysToCopy: string[];
  filter?: string;
  prefix: string;
  start: string;
  end: string;
  from: number;
  show: number;
  reverse: boolean;
  abortId: string;
}

interface CopyOpResult {
  duration: number;
  copyEntries: number;
  copyResult: SetResult;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = ctx.state.session as string;
    const data = await req.json() as CopyKeysData;

    try {
      const result = await copyKeys(data, session);
      const copyResult = result.copyResult;
      console.debug("Copy result", copyResult);

      const state = getUserState(session);

      const conn = await localKv.get<KvConnection>([
        CONNECTIONS_KEY_PREFIX,
        data.destConnectionId,
      ]);

      const copyAudit: CopyAuditLog = {
        auditType: "copy",
        executorId: executorId(session),
        connection: auditConnectionName(state.connection!),
        destinationConnection: conn.value ? auditConnectionName(conn.value) : "<unknown>",
        isDestinationDeploy: conn.value ? conn.value.isRemote : false,
        isDeploy: state.connection!.isRemote,
        rtms: result.duration,
        keysCopied: copyResult.setKeyCount,
        keysFailed: copyResult.failedKeys.length,
        aborted: copyResult.aborted,
        writeUnitsConsumed: copyResult.writeUnitsConsumed,
      };
      await auditAction(copyAudit);

      let status = 200;
      let body = "";
      const kc = copyResult.setKeyCount;
      
      if (copyResult.aborted) {
        const percComplete = kc / result.copyEntries;
        const percCompleteString = `${Math.round(percComplete * 100)}%`;
        body = `Copy aborted at ${percCompleteString} complete. ${kc} key${kc > 1 ? "s" : ""} copied`;
        status = 499;
      } else if (copyResult.failedKeys.length > 0) {
        body = `Copied ${kc} key${
          kc > 1 ? "s" : ""
        }.  Failed to copy ${copyResult.failedKeys.length} key${
          copyResult.failedKeys.length > 1 ? "s" : ""
        }`;
        status = 500;
      } else {
        body = kc > 1 ? `${kc} KV entries successfully copied` : `KV entry successfully copied`;
      }

      return new Response(body, {
        status,
      });
    } catch (e) {
      console.error("Failed to copy keys", e);

      return new Response("Failed to copy keys", {
        status: 500,
      });
    }
  },
};

async function copyKeys(data: CopyKeysData, session: string): Promise<CopyOpResult> {
  const {
    sourceConnectionId,
    destConnectionId,
    keysToCopy,
    prefix,
    start,
    end,
    reverse,
    from,
    show,
    abortId,
  } = data;
  const keyOperationData = {
    connectionId: sourceConnectionId,
    keysSelected: keysToCopy,
    prefix,
    start,
    end,
    reverse,
    from,
    show,
  } satisfies KeyOperationData;
  const startTime = Date.now();

  //Compute which keys to copy
  const copyEntries = await entriesToOperateOn(keyOperationData, session);

  const destKv = await connectToDestKv(session, destConnectionId);

  //TODO - implement SSE progress updates.  Client can register progress id through POST body,
  //      and then GET progress updates through a separate endpoint.
  const startCopyTime = Date.now();
  const copyResult = await setAll(copyEntries, destKv, abortId);
  console.debug("  Time to copy keys", Date.now() - startCopyTime, "ms");

  const overallDuration = Date.now() - startTime;
  return {
    duration: overallDuration,
    copyEntries: copyEntries.length,
    copyResult,
  };
}

async function connectToDestKv(session: string, destConnectionId: string): Promise<Deno.Kv> {
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
