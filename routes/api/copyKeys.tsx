import { Handlers } from "$fresh/server.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { CopyAuditLog, KvConnection } from "../../types.ts";
import { executorId } from "../../utils/connections/denoDeploy/deployUser.ts";
import { CacheInvalidationError } from "../../utils/errors.ts";
import { localKv } from "../../utils/kv/db.ts";
import { auditAction, auditConnectionName } from "../../utils/kv/kvAudit.ts";
import { connectToSecondaryKv } from "../../utils/kv/kvConnect.ts";
import { setAll, SetResult } from "../../utils/kv/kvSet.ts";
import { logDebug, logError } from "../../utils/log.ts";
import { getUserState } from "../../utils/state/state.ts";
import { entriesToOperateOn, KeyOperationData } from "../../utils/ui/list/buildResultsPage.ts";
import { asPercentString } from "../../utils/ui/display.ts";

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
      logDebug({ sessionId: session }, "Copy result", copyResult);

      const state = getUserState(session);

      const conn = await localKv.get<KvConnection>([
        CONNECTIONS_KEY_PREFIX,
        data.destConnectionId,
      ]);

      const copyAudit: CopyAuditLog = {
        auditType: "copy",
        executorId: await executorId(session),
        connection: auditConnectionName(state.connection!),
        destinationConnection: conn.value ? auditConnectionName(conn.value) : "<unknown>",
        destinationInfra: conn.value ? conn.value.infra : "unknown",
        infra: state.connection!.infra,
        rtms: result.duration,
        keysCopied: copyResult.setKeyCount,
        keysFailed: copyResult.failedKeys.length,
        aborted: copyResult.aborted,
        writeUnitsConsumed: copyResult.writeUnitsConsumed,
      };
      await auditAction(copyAudit, session);

      let status = 200;
      let body = "";
      const kc = copyResult.setKeyCount;

      if (copyResult.aborted) {
        const percComplete = kc / result.copyEntries;
        body = `Copy aborted at ${asPercentString(percComplete)} complete. ${kc} key${
          kc > 1 ? "s" : ""
        } copied`;
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
      logError({ sessionId: session }, "Failed to copy keys", e.message);
      const errorMessage = e instanceof CacheInvalidationError ? e.message : "Failed to copy keys";
      return new Response(errorMessage, {
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
    filter,
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
    filter,
    reverse,
    from,
    show,
  } satisfies KeyOperationData;
  const startTime = Date.now();

  //Compute which keys to copy
  const copyEntries = await entriesToOperateOn(keyOperationData, session);

  const destKv = await connectToSecondaryKv(session, destConnectionId);
  let copyResult: SetResult;
  try {
    //TODO - implement SSE progress updates.  Client can register progress id through POST body,
    //      and then GET progress updates through a separate endpoint.
    const startCopyTime = Date.now();
    copyResult = await setAll(copyEntries, destKv, abortId);
    logDebug({ sessionId: session }, "  Time to copy keys", Date.now() - startCopyTime, "ms");
  } finally {
    destKv.close();
  }

  const overallDuration = Date.now() - startTime;
  return {
    duration: overallDuration,
    copyEntries: copyEntries.length,
    copyResult,
  };
}
