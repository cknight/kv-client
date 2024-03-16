import { assertEquals } from "$std/assert/assert_equals.ts";
import { assertGreaterOrEqual } from "$std/assert/assert_greater_or_equal.ts";
import { deleteAbortId } from "../state/state.ts";
import { abort } from "../state/state.ts";
import { cleanup, createDb } from "../test/testUtils.ts";
import { deleteAll, DeleteResult } from "./kvDelete.ts";
import { _internals } from "./kvQueue.ts";

Deno.test("kvDelete - delete key", async () => {
  const kv = await createDb();
  try {
    assertEquals(await lengthOf(kv), 0);
    let keysToDelete = [];
    for (let i = 0; i < 1005; i++) {
      await kv.set(["testKey-" + i], "testValue-" + i);
      keysToDelete.push(["testKey-" + i]);
    }

    //Delete 1 key
    let result = await deleteAll([["testKey-0"]], kv, "do not abort");
    await assertResult(kv, result, 1, 1004);

    //Delete remaining keys
    result = await deleteAll(keysToDelete.slice(1), kv, "do not abort");
    await assertResult(kv, result, 1004, 0);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("deleteAll - non existent key is no-op", async () => {
  const kv = await createDb();
  try {
    assertEquals(await lengthOf(kv), 0);
    const result = await deleteAll([["non-existant key"]], kv, "do not abort");

    //even though the key does not exist, the operation is still sent to kv and thus counts
    //as a key deleted
    await assertResult(kv, result, 1, 0);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("deleteAll - abort", async () => {
  const kv = await createDb();
  try {
    assertEquals(await lengthOf(kv), 0);
    const keysToDelete = [];
    for (let i = 0; i < 100; i++) {
      await kv.set(["testKey-" + i], "testValue-" + i);
      keysToDelete.push(["testKey-" + i]);
    }

    //disable queue to prevent abort cleanup from enqueueing
    _internals.enqueue = async (_msg: unknown, _delay: number) => {};

    await abort("abort");
    const result = await deleteAll(keysToDelete, kv, "abort");
    assertEquals(result.aborted, true);
    assertEquals(result.failedKeys, []);
    assertEquals(result.deletedKeyCount, 0);
    assertEquals(result.writeUnitsConsumed, 0);
  } finally {
    deleteAbortId("abort");
    await cleanup(kv);
  }
});

async function lengthOf(kv: Deno.Kv): Promise<number> {
  return (await Array.fromAsync(kv.list({ prefix: [] }))).length;
}

async function assertResult(
  kv: Deno.Kv,
  result: DeleteResult,
  deleteCount: number,
  remainingLength: number,
) {
  console.log(await lengthOf(kv));
  assertEquals(await lengthOf(kv), remainingLength);
  assertEquals(result.aborted, false);
  assertEquals(result.failedKeys, []);
  assertEquals(result.deletedKeyCount, deleteCount);
  assertGreaterOrEqual(result.writeUnitsConsumed, 1);
}
