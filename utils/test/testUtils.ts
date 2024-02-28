import { _internals } from "../kv/kvQueue.ts";

export function disableQueue() {
  _internals.enqueue = async (msg: unknown, delay: number) => {};
}