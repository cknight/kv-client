import { createFreshContext } from "$fresh-testing-library/server.ts";
import { FreshContext } from "$fresh/server.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import manifest from "../../fresh.gen.ts";
import { localKv } from "../kv/db.ts";
import { _internals } from "../kv/kvQueue.ts";

export const SESSION_ID = "session_1234";

export function disableQueue() {
  _internals.enqueue = async (msg: unknown, delay: number) => {};
}

export async function addTestConnection(location: string, id: string) {
  await localKv.set([CONNECTIONS_KEY_PREFIX, id], {
    kvLocation: location,
    environment: "local",
    name: "test-" + id,
    id: id,
    infra: "local",
    size: 0,
  });
}

export function createFreshCtx(request: Request): FreshContext<
  {
    session: string;
  },
  void,
  void
> {
  const state = { session: SESSION_ID };
  const ctx = createFreshContext<void, typeof state>(request, { manifest, state });
  return ctx;
}
