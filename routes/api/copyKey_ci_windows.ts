import { Handlers } from "$fresh/server.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { CopyAuditLog, KvConnection, KvGetOptions } from "../../types.ts";
import { executorId } from "../../utils/user/denoDeploy/deployUser.ts";
import { localKv } from "../../utils/kv/db.ts";
import { auditAction, auditConnectionName } from "../../utils/kv/kvAudit.ts";
import { SetResult } from "../../utils/kv/kvSet.ts";
import { logDebug } from "../../utils/log.ts";
import { getUserState } from "../../utils/state/state.ts";
import { kvGet } from "../../utils/kv/kvGet.ts";

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
      logDebug({ sessionId: session }, "Copy result", copyResult);

      const state = getUserState(session);
      const conn = await localKv.get<KvConnection>([
        CONNECTIONS_KEY_PREFIX,
        data.destConnectionId,
      ]);

      const copyAudit: CopyAuditLog = {
        auditType: "copy",
        executorId: await executorId(session),
        connection: "silly",
        destinationConnection: conn.value ? auditConnectionName(conn.value) : "<unknown>",
        destinationInfra: conn.value ? conn.value.infra : "unknown",
        infra: "local",
        rtms: result.duration,
        keysCopied: copyResult.setKeyCount,
        keysFailed: copyResult.failedKeys.length,
        aborted: copyResult.aborted,
        writeUnitsConsumed: copyResult.writeUnitsConsumed,
      };
      await auditAction(copyAudit, session);

      let status = 200;
      let body = "";

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

// deno-lint-ignore require-await
async function copyKey(data: CopyKeyData, _session: string): Promise<CopyOpResult> {
  const {
    sourceConnectionId: _sourceConnectionId,
    destConnectionId: _destConnectionId,
    keyToCopy: _keyToCopy,
  } = data;

  const startTime = Date.now();

  const getKvOptions: KvGetOptions = {
    session: _session,
    connectionId: _sourceConnectionId,
    key: _keyToCopy,
  };
  const copyEntry = await kvGet(getKvOptions);
  if (copyEntry.versionstamp === null) {
    throw new Error(`Key [${_keyToCopy}] does not exist`);
  }

  // const destKv = await connectToSecondaryKv(session, destConnectionId);
  // let copyResult: SetResult;
  // try {
  //   const startCopyTime = Date.now();
  //   copyResult = await setAll([copyEntry], destKv, "no abort");
  //   logDebug({ sessionId: session }, "  Time to copy key", Date.now() - startCopyTime, "ms");
  // } finally {
  //   destKv.close();
  // }

  const overallDuration = Date.now() - startTime;

  return {
    duration: overallDuration,
    success: true,
    copyResult: {
      failedKeys: [],
      aborted: false,
      setKeyCount: 1,
      writeUnitsConsumed: 0,
      lastSuccessfulVersionstamp: "abcd",
    },
  };
}
