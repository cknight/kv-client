import { State } from "../types.ts";
import { CacheManager } from "./cache.ts";

const states: Map<string, State> = new Map();

export function getState(session:string): State {
  const state = states.get(session);

  if (!state) {
    const newState: State = {
      kv: null,
      connection: null,
      cache: new CacheManager(),
    };
    states.set(session, newState);
    return newState;
  }

  return state;
}