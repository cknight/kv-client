import { Handlers } from "$fresh/server.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { DeleteAuditLog, KvConnection } from "../../types.ts";
import { executorId } from "../../utils/denoDeploy/deployUser.ts";
import { localKv } from "../../utils/kv/db.ts";
import { auditAction, auditConnectionName } from "../../utils/kv/kvAudit.ts";
import { establishKvConnection } from "../../utils/kv/kvConnect.ts";
import { deleteAll, DeleteResult } from "../../utils/kv/kvDelete.ts";
import { computeSize, writeUnitsConsumed } from "../../utils/kv/kvUnitsConsumed.ts";
import { getUserState } from "../../utils/state.ts";
import { entriesToOperateOn } from "../../utils/ui/buildResultsPage.ts";

export interface DeleteKeysData {
  connectionId: string;
  keysToDelete: string[];
  filter?: string;
  prefix: string;
  start: string;
  end: string;
  from: number;
  show: number;
  reverse: boolean;
  abortId: string;
}

interface DeleteOpResult {
  duration: number;
  deleteResult: DeleteResult;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = ctx.state.session as string;
    const data = await req.json() as DeleteKeysData;

    try {
      const result = await deleteKeys(data, session);
      const deleteResult = result.deleteResult;
      console.debug("Delete result", deleteResult);

      const state = getUserState(session);

      const deleteAudit: DeleteAuditLog = {
        auditType: "delete",
        executorId: executorId(session),
        connection: auditConnectionName(state.connection!),
        isDeploy: state.connection!.isRemote,
        rtms: result.duration,
        keysDeleted: deleteResult.deletedKeyCount,
        keysFailed: deleteResult.failedKeys.length,
        aborted: deleteResult.aborted,
        writeUnitsConsumed: deleteResult.writeUnitsConsumed,
      };
      await auditAction(deleteAudit);

      let status = 200;
      let body = "";
      const dc = deleteResult.deletedKeyCount;

      if (deleteResult.aborted) {
        body = `Deletion aborted. ${deleteResult.deletedKeyCount} key${dc > 1 ? "s" : ""} deleted`;
        status = 499;
      } else if (deleteResult.failedKeys.length > 0) {
        body = `Deleted ${dc} key${
          dc > 1 ? "s" : ""
        }.  Failed to delete ${deleteResult.failedKeys.length} key${
          deleteResult.failedKeys.length > 1 ? "s" : ""
        }`;
        status = 500;
      } else {
        body = dc > 1 ? `All ${deleteResult.deletedKeyCount} keys deleted` : `Key successfully deleted`;
      }
      getUserState(session).cache.clear();
      return new Response(body, {
        status,
      });
    } catch (e) {
      console.error("Failed to delete keys", e);
      getUserState(session).cache.clear();
      return new Response("Failed to delete keys", {
        status: 500,
      });
    }
  },
};

async function deleteKeys(data: DeleteKeysData, session: string): Promise<DeleteOpResult> {
  const { connectionId, keysToDelete, prefix, start, end, reverse, from, show, abortId } = data;
  const keyOperationData = {
    connectionId,
    keysSelected: keysToDelete,
    prefix,
    start,
    end,
    reverse,
    from,
    show,
  };
  const startTime = Date.now();

  //Compute which keys to delete
  const deleteEntries = await entriesToOperateOn(keyOperationData, session);
  const kvKeysToDelete = deleteEntries.map((e) => e.key);
  const state = getUserState(session);

  await establishKvConnection(session, connectionId);

  //Delete the keys
  //TODO - implement SSE progress updates.  Client can register progress id through POST body,
  //      and then GET progress updates through a separate endpoint.
  const startDeleteTime = Date.now();
  const deleteResult = await deleteAll(kvKeysToDelete, state.kv!, abortId);
  console.log("  Time to delete keys", Date.now() - startDeleteTime, "ms");

  const overallDuration = Date.now() - startTime;
  return { duration: overallDuration, deleteResult };
}
