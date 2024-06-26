import { createFreshContext } from "$fresh-testing-library/server.ts";
import { FreshContext } from "$fresh/server.ts";
import { join } from "@std/path";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import manifest from "../../fresh.gen.ts";
import { logout } from "../user/logout.ts";
import { localKv } from "../kv/db.ts";
import { _internals } from "../kv/kvQueue.ts";
import { shortHash } from "../utils.ts";

/**
 * @module testUtils - a collection of utilities for unit testing
 */

export const SESSION_ID = "session_1234";

export function disableQueue() {
  _internals.enqueue = async (_msg: unknown, _delay: number) => {};
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

export const TEST_DB_DIR = "testDb" + crypto.randomUUID();
export const DB_PATH = join(Deno.cwd(), TEST_DB_DIR, "test_source.db");
export const DB_ID = await shortHash(DB_PATH);

export async function createDb() {
  await Deno.mkdir(TEST_DB_DIR);
  await addTestConnection(DB_PATH, DB_ID);
  const sourceKv = await Deno.openKv(DB_PATH);
  return sourceKv;
}

export async function cleanup(kv?: Deno.Kv) {
  if (kv) {
    kv.close();
  }

  await logout(SESSION_ID);
  await localKv.delete([CONNECTIONS_KEY_PREFIX, DB_ID]);

  try {
    await Deno.remove(join(Deno.cwd(), TEST_DB_DIR), { recursive: true });
  } catch (_e) { /* No op */ }
}

export async function lengthOf(kv: Deno.Kv): Promise<number> {
  return (await Array.fromAsync(kv.list({ prefix: [] }))).length;
}
