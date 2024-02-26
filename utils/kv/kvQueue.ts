import { QueueDeleteExportFile } from "../../types.ts";
import { logDebug, logError } from "../log.ts";
import { localKv } from "./db.ts";

function isDeleteExportFile(msg: unknown): msg is QueueDeleteExportFile {
  return (msg as QueueDeleteExportFile).channel === "DeleteMessage";
}

const listenQueueUser = {sessionId: "-- listenQueue --"}

localKv.listenQueue(async (msg: unknown) => {
  if (isDeleteExportFile(msg)) {
    logDebug(listenQueueUser, "Deleting export file", msg.message.exportId);
    try {
      await Deno.remove(msg.message.tempDirPath, { recursive: true });
    } catch (e) {
      logError(listenQueueUser, "Unable to delete file:", e.message);
    }
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
