import { PageProps } from "$fresh/server.ts";
import { State } from "../../types.ts";
import { CacheManager } from "./cache.ts";

const states: Map<string, State> = new Map();

const abortSet = new Set<string>();

export function abort(id: string): void {
  abortSet.add(id);

  // Clean up after 10 minutes just in case
  setTimeout(() => {
    abortSet.delete(id);
  }, 1000 * 60 * 10);
}

export function shouldAbort(id: string): boolean {
  if (abortSet.has(id)) {
    abortSet.delete(id);
    return true;
  }
  return false;
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
