import { QueueDeleteAbortId, QueueDeleteExportFile, QueueDeleteExportStatus } from "../../types.ts";
import { logDebug, logError } from "../log.ts";
import { deleteAbortId, deleteExportStatus } from "../state/state.ts";
import { localKv } from "./db.ts";

function isDeleteExportFile(msg: unknown): msg is QueueDeleteExportFile {
  return (msg as QueueDeleteExportFile).channel === "DeleteMessage";
}

function isDeleteExportStatus(msg: unknown): msg is QueueDeleteExportStatus {
  return (msg as QueueDeleteExportStatus).channel === "DeleteStatus";
}

function isDeleteAbortId(msg: unknown): msg is QueueDeleteAbortId {
  return (msg as QueueDeleteAbortId).channel === "DeleteAbortId";
}

const listenQueueUser = {sessionId: "-- listenQueue --"}

export async function enqueueWork(msg: unknown, delay: number): Promise<void> {
  await localKv.enqueue(msg, {
    delay,
    keysIfUndelivered: [["QUEUE_MSG_UNDELIVERED"]],
  });
}

localKv.listenQueue(async (msg: unknown) => {
  if (isDeleteExportFile(msg)) {
    logDebug(listenQueueUser, "Deleting export file", msg.message.exportId);
    try {
      await Deno.remove(msg.message.tempDirPath, { recursive: true });
    } catch (e) {
      logError(listenQueueUser, "Unable to delete file:", e.message);
    }
  } else if (isDeleteExportStatus(msg)) {
    logDebug(listenQueueUser, "Deleting export status", msg.message.exportId);
    deleteExportStatus(msg.message.exportId);
  } else if (isDeleteAbortId(msg)) {
    logDebug(listenQueueUser, "Deleting abort id", msg.message.abortId);
    deleteAbortId(msg.message.abortId);
  } else {
    logError(listenQueueUser, "Unknown queue message", msg);
  }
});

/**
 * This function doesn't actually register the queue listener, but the action of
 * importing this module will.
 */
export function registerQueueListener() {
  logDebug({ sessionId: "-" }, "Queue listener now registered");
}
