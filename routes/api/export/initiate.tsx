import { Handlers } from "$fresh/server.ts";
import { join } from "$std/path/join.ts";
import { EXPORT_PATH } from "../../../consts.ts";
import { ExportAuditLog, QueueDeleteExportFile } from "../../../types.ts";
import { getKvConnectionDetails } from "../../../utils/connections/connections.ts";
import { executorId } from "../../../utils/user/denoDeploy/deployUser.ts";
import { localKv } from "../../../utils/kv/db.ts";
import { auditAction, auditConnectionName } from "../../../utils/kv/kvAudit.ts";
import { establishKvConnection } from "../../../utils/kv/kvConnect.ts";
import { enqueueWork } from "../../../utils/kv/kvQueue.ts";
import { setAll } from "../../../utils/kv/kvSet.ts";
import { computeSize, readUnitsConsumed } from "../../../utils/kv/kvUnitsConsumed.ts";
import { logDebug } from "../../../utils/log.ts";
import { shouldAbort, updateExportStatus } from "../../../utils/state/state.ts";

const _24_HOURS_IN_MS = 24 * 60 * 60 * 1000;

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const connectionId = form.get("connectionId");
    const session = ctx.state.session as string;
    const exportId = form.get("exportId");

    if (!connectionId || typeof connectionId !== "string") {
      return new Response("No connectionId provided", { status: 400 });
    }
    if (!exportId || typeof exportId !== "string") {
      return new Response("No exportId provided", { status: 400 });
    }

    try {
      await updateExportStatus(
        exportId,
        { status: "initiating", keysProcessed: 0, bytesProcessed: 0 },
        session,
      );
      //don't await so that this becomes a background process
      initiateExport(session, connectionId, exportId);
    } catch (e) {
      console.error("Failed to export", e);
      return new Response("Failed to export", { status: 500 });
    }

    return new Response("Export initiated", { status: 200 });
  },
};

async function initiateExport(session: string, connectionId: string, exportId: string) {
  const startTime = Date.now();
  const kv = await establishKvConnection(session, connectionId);
  const connDetails = await getKvConnectionDetails(connectionId);

  let tempDir: string | undefined;
  let tempDbPath: string | undefined;
  let tempKv: Deno.Kv | undefined;
  let keysProcessed = 0;
  let bytesProcessed = 0;
  let totalEntrySizes = 0;

  try {
    tempDir = await Deno.makeTempDir({ prefix: "kv_client_export_" });
    tempDbPath = join(tempDir, "export.db");
    tempKv = await Deno.openKv(tempDbPath);
    await localKv.set([EXPORT_PATH, session, exportId], tempDbPath, { expireIn: _24_HOURS_IN_MS });

    let kvEntries: Deno.KvEntry<unknown>[] = [];
    // Since reading an entire KV store cannot be done in a consistent manner if more than 500 keys,
    // we might as well use eventual consistency for higher performance
    const listIterator = kv.list({ prefix: [] }, { batchSize: 500, consistency: "eventual" });
    for await (const entry of listIterator) {
      if (shouldAbort(exportId)) {
        await updateExportStatus(
          exportId,
          { status: "aborted", keysProcessed, bytesProcessed },
          session,
        );
        throw new UnableToCompleteError("Export aborted", true);
      }

      kvEntries.push(entry);
      totalEntrySizes += computeSize(entry.key, entry.value);
      // 1000 is the max number of keys that can be set at once.  This is a KV constraint.
      if (kvEntries.length === 1000) {
        await setEntriesInDbFile(kvEntries, tempKv);
        kvEntries = [];
      }
    }
    if (kvEntries.length > 0) {
      await setEntriesInDbFile(kvEntries, tempKv);
    }
    await updateExportStatus(
      exportId,
      { status: "complete", keysProcessed, bytesProcessed },
      session,
    );
    logDebug(
      { sessionId: session },
      `Export complete for id ${exportId} in ${Date.now() - startTime}ms`,
    );

    await enqueueDeletionOfTemporaryDbFile(exportId, tempDbPath);

    const auditRecord: ExportAuditLog = {
      auditType: "export",
      executorId: await executorId(session),
      connection: auditConnectionName(connDetails!),
      infra: connDetails!.infra,
      rtms: Date.now() - startTime,
      keysExported: keysProcessed,
      aborted: false,
      bytesRead: bytesProcessed,
      readUnitsConsumed: readUnitsConsumed(totalEntrySizes),
    };
    await auditAction(auditRecord, session);
  } catch (e) {
    console.error("Failed to export", e);
    if (!(e instanceof UnableToCompleteError)) {
      await updateExportStatus(
        exportId,
        { status: "failed", keysProcessed, bytesProcessed },
        session,
      );
    }
    tempKv && tempKv.close();
    tempKv = undefined;
    tempDir && await Deno.remove(tempDir, { recursive: true });
    const auditRecord: ExportAuditLog = {
      auditType: "export",
      executorId: await executorId(session),
      connection: auditConnectionName(connDetails!),
      infra: connDetails!.infra,
      rtms: Date.now() - startTime,
      keysExported: keysProcessed,
      aborted: (e instanceof UnableToCompleteError) ? e.isAborted : false,
      bytesRead: bytesProcessed,
      readUnitsConsumed: readUnitsConsumed(totalEntrySizes),
    };
    await auditAction(auditRecord, session);
    return;
  } finally {
    tempKv && tempKv.close();
  }

  async function setEntriesInDbFile(
    kvEntries: Deno.KvEntry<unknown>[],
    tempKv: Deno.Kv,
  ) {
    const setResult = await setAll(kvEntries, tempKv, exportId);
    keysProcessed += setResult.setKeyCount;
    bytesProcessed = Deno.statSync(tempDbPath!).size;

    if (setResult.aborted) {
      await updateExportStatus(
        exportId,
        { status: "aborted", keysProcessed, bytesProcessed },
        session,
      );
      throw new UnableToCompleteError("Export aborted", true);
    } else if (setResult.failedKeys.length > 0) {
      logDebug(
        { sessionId: session },
        `Failed to set ${setResult.failedKeys} keys during export for id ${exportId}`,
      );
      await updateExportStatus(
        exportId,
        { status: "failed", keysProcessed, bytesProcessed },
        session,
      );
      throw new UnableToCompleteError("Export failed");
    }
    await updateExportStatus(
      exportId,
      { status: "in progress", keysProcessed, bytesProcessed },
      session,
    );
  }
}

class UnableToCompleteError extends Error {
  constructor(message: string, public isAborted = false) {
    super(message);
    this.name = "UnableToCompleteError";
  }
}

async function enqueueDeletionOfTemporaryDbFile(exportId: string, tempDbPath: string) {
  const deleteMsg: QueueDeleteExportFile = {
    channel: "DeleteMessage",
    message: {
      exportId,
      tempDirPath: tempDbPath,
    },
  };
  await enqueueWork(deleteMsg, _24_HOURS_IN_MS);
}
