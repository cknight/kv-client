import { PageProps } from "$fresh/server.ts";
import { ExportStatus, QueueDeleteAbortId, QueueDeleteExportStatus, State } from "../../types.ts";
import { enqueueWork } from "../kv/kvQueue.ts";
import { logDebug } from "../log.ts";
import { CacheManager } from "./cache.ts";

const states: Map<string, State> = new Map();
const abortSet = new Set<string>();
const exportStatus = new Map<string, ExportStatus>();
const _10_MINUTES = 1000 * 60 * 10;
export const userNames = new Map<string, string>();

export async function abort(id: string): Promise<void> {
  abortSet.add(id);

  // Clean up after 10 minutes just in case
  await enqueueWork({
    channel: "DeleteAbortId",
    message: {
      abortId: id,
    },
  } as QueueDeleteAbortId, _10_MINUTES);
}

export function deleteAbortId(id: string): void {
  abortSet.delete(id);
}

export function shouldAbort(id: string): boolean {
  if (abortSet.has(id)) {
    abortSet.delete(id);
    return true;
  }
  return false;
}

/**
 * For a given export job, update the status.  If complete, delete the status after 10 minutes to
 * prevent memory leaks.
 *
 * @param id The id of the export job
 * @param status The status of the job
 * @param session session id of the user
 */
export async function updateExportStatus(
  id: string,
  status: ExportStatus,
  session: string,
): Promise<void> {
  logDebug({ sessionId: session }, "Updating export status", id, status);
  exportStatus.set(id, status);

  if (status.status !== "in progress" && status.status !== "initiating") {
    await enqueueWork({
      channel: "DeleteStatus",
      message: {
        exportId: id,
      },
    } as QueueDeleteExportStatus, _10_MINUTES);
  }
}

export function getExportStatus(id: string): ExportStatus | undefined {
  return exportStatus.get(id);
}

export function deleteExportStatus(id: string): void {
  exportStatus.delete(id);
}

export function getUserState(sessionOrCtx: string | PageProps): State {
  let sessionId = "";
  if (typeof sessionOrCtx === "string") {
    sessionId = sessionOrCtx;
  } else {
    sessionId = (sessionOrCtx.state as Record<string, unknown>).session as string;
  }

  const state = states.get(sessionId);

  if (!state) {
    const newState: State = {
      kv: null,
      connection: null,
      cache: new CacheManager(),
    };
    states.set(sessionId, newState);
    return newState;
  }

  return state;
}

export function deleteUserState(session: string): void {
  const state = getUserState(session);
  state.kv?.close(); 
  state.kv = null;
  state.connection = null;
  state.cache.clear();
  states.delete(session);
  userNames.delete(session);
}
