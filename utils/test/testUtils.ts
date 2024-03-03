import { createFreshContext } from "$fresh-testing-library/server.ts";
import { FreshContext } from "$fresh/server.ts";
import { join } from "$std/path/join.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import manifest from "../../fresh.gen.ts";
import { logout } from "../connections/denoDeploy/logout.ts";
import { localKv } from "../kv/db.ts";
import { _internals } from "../kv/kvQueue.ts";
import { getUserState } from "../state/state.ts";

/**
 * @module testUtils - a collection of utilities for unit testing
 */

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

export async function createDb() {
  await Deno.mkdir("testDb");
  const sourceDbPath = join(Deno.cwd(), "testDb", "test_source.db");
  await addTestConnection(sourceDbPath, "123");
  const sourceKv = await Deno.openKv(sourceDbPath);
  return sourceKv;
}

export async function cleanup(kv?: Deno.Kv) {
  if (kv) {
    kv.close();
    console.log("Closed kv 1")
  }
  await Deno.remove(join(Deno.cwd(), "testDb"), { recursive: true });
  await localKv.delete([CONNECTIONS_KEY_PREFIX, "123"]);
  await logout(SESSION_ID);
}
