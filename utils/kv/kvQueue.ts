import { QueueDeleteExportFile } from "../../types.ts";
import { localKv } from "./db.ts";

function isDeleteExportFile(msg: unknown): msg is QueueDeleteExportFile {
  return (msg as QueueDeleteExportFile).channel === "DeleteMessage";
}

localKv.listenQueue(async (msg: unknown) => {
  if (isDeleteExportFile(msg)) {
    console.log("Deleting export file", msg.message.exportId);
    try {
      await Deno.remove(msg.message.tempDirPath, { recursive: true });
    } catch (e) {
      console.error("Unable to delete file:", e.message);
    }
  } else {
    console.error("Unknown queue message", msg);
  }
});

/**
 * This function doesn't actually register the queue listener, but the action of
 * importing this module will.
 */
export function registerQueueListener() {
  console.debug("Queue listener now registered");
}
