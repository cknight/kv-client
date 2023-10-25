import { PageProps } from "$fresh/server.ts";
import { State } from "../types.ts";
import { CacheManager } from "./cache.ts";

const states: Map<string, State> = new Map();

export function getUserState(sessionOrCtx: string | PageProps): State {
  let sessionId = "";

  if (typeof sessionOrCtx === "string") {
    sessionId = sessionOrCtx;
  } else {
    sessionId = sessionOrCtx.state.session as string;
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
