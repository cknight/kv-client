import { Handlers } from "$fresh/server.ts";
import { DeleteAuditLog } from "../../types.ts";
import { executorId } from "../../utils/connections/denoDeploy/deployUser.ts";
import { auditAction, auditConnectionName } from "../../utils/kv/kvAudit.ts";
import { establishKvConnection } from "../../utils/kv/kvConnect.ts";
import { deleteAll } from "../../utils/kv/kvDelete.ts";
import { logDebug } from "../../utils/log.ts";
import { getUserState } from "../../utils/state/state.ts";
import { parseKvKey } from "../../utils/transform/kvKeyParser.ts";

export interface DeleteKeyData {
  connectionId: string;
  keyToDelete: string;
}

interface DeleteOpResult {
  duration: number;
  success: boolean;
  writeUnitsConsumed: number;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = ctx.state.session as string;
    const data = await req.json() as DeleteKeyData;

    try {
      const result = await deleteKey(data, session);
      logDebug({ sessionId: session }, "Delete successful:", result);

      const state = getUserState(session);

      const deleteAudit: DeleteAuditLog = {
        auditType: "delete",
        executorId: await executorId(session),
        connection: auditConnectionName(state.connection!),
        infra: state.connection!.infra,
        rtms: result.duration,
        keysDeleted: result.success ? 1 : 0,
        keysFailed: result.success ? 0 : 1,
        aborted: false,
        writeUnitsConsumed: result.writeUnitsConsumed,
      };
      await auditAction(deleteAudit, session);

      let status = 200;
      let body = "";

      if (result.success) {
        body = `KV entry successfully deleted`;
      } else {
        body = `Failed to delete KV entry`;
        status = 500;
      }
      getUserState(session).cache.clear();
      return new Response(body, {
        status,
      });
    } catch (e) {
      console.error("Failed to delete entry", e);
      getUserState(session).cache.clear();
      return new Response("Failed to delete entry", {
        status: 500,
      });
    }
  },
};

async function deleteKey(data: DeleteKeyData, session: string): Promise<DeleteOpResult> {
  const { connectionId, keyToDelete } = data;
  const startTime = Date.now();
  const kvKey = parseKvKey(keyToDelete);

  const kv = await establishKvConnection(session, connectionId);

  //Delete the key
  const startDeleteTime = Date.now();
  const deleteResult = await deleteAll([kvKey], kv, "no-abort");
  console.log("  Time to delete key", Date.now() - startDeleteTime, "ms");

  const overallDuration = Date.now() - startTime;
  return {
    duration: overallDuration,
    success: deleteResult.deletedKeyCount === 1,
    writeUnitsConsumed: deleteResult.writeUnitsConsumed,
  };
}
