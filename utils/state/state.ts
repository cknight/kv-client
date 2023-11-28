import { HandlerContext, LayoutContext, PageProps } from "$fresh/server.ts";
import { State } from "../../types.ts";
import { CacheManager } from "./cache.ts";

const states: Map<string, State> = new Map();

export function getUserState(sessionOrCtx: string | PageProps | HandlerContext | LayoutContext<void, unknown>): State {
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
      deployUserData: null,
    };
    states.set(sessionId, newState);
    return newState;
  }

  return state;
}
