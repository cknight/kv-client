import { Handlers } from "$fresh/server.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { CopyAuditLog, KvConnection, KvGetOptions } from "../../types.ts";
import { executorId } from "../../utils/connections/denoDeploy/deployUser.ts";
import { localKv } from "../../utils/kv/db.ts";
import { auditAction, auditConnectionName } from "../../utils/kv/kvAudit.ts";
import { setAll, SetResult } from "../../utils/kv/kvSet.ts";
import { getUserState } from "../../utils/state/state.ts";
import { getKv } from "../../utils/kv/kvGet.ts";
import { connectToDestKv } from "../../utils/connections/connections.ts";

export interface CopyKeyData {
  sourceConnectionId: string;
  destConnectionId: string;
  keyToCopy: string;
} 

interface CopyOpResult {
  duration: number;
  success: boolean;
  copyResult: SetResult;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = ctx.state.session as string;
    const data = await req.json() as CopyKeyData;

    try {
      const result = await copyKey(data, session);
      const copyResult = result.copyResult;
      console.debug("Copy result", copyResult);

      const state = getUserState(session);

      const conn = await localKv.get<KvConnection>([
        CONNECTIONS_KEY_PREFIX,
        data.destConnectionId,
      ]);

      //TODO Remove/change 'isDestinationDeploy' and 'isDeploy' from audit log
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

      if (copyResult.failedKeys.length > 0) {
        body = `Copy failed`;
        status = 500;
      } else {
        body = `KV entry successfully copied`;
      }

      return new Response(body, {
        status,
      });
    } catch (e) {
      console.error("Failed to copy entry", e);

      return new Response("Failed to copy entry", {
        status: 500,
      });
    }
  },
};

async function copyKey(data: CopyKeyData, session: string): Promise<CopyOpResult> {
  const {
    sourceConnectionId,
    destConnectionId,
    keyToCopy,
  } = data;

  const startTime = Date.now();

  const getKvOptions: KvGetOptions = {
    session: session,
    connectionId: sourceConnectionId,
    key: keyToCopy
  };
  const copyEntry = await getKv(getKvOptions);
  if (copyEntry.versionstamp === null) {
    throw new Error(`Key [${keyToCopy}] does not exist`);
  }

  const destKv = await connectToDestKv(session, destConnectionId);

  const startCopyTime = Date.now();
  const copyResult = await setAll([copyEntry], destKv, "no abort");
  console.debug("  Time to copy key", Date.now() - startCopyTime, "ms");

  const overallDuration = Date.now() - startTime;

  return {
    duration: overallDuration,
    success: copyResult.setKeyCount === 1,
    copyResult,
  };
}
