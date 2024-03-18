import { assertEquals } from "$std/assert/assert_equals.ts";
import { assertGreaterOrEqual } from "$std/assert/assert_greater_or_equal.ts";
import { assert } from "$std/assert/assert.ts";
import { cleanup, createDb, lengthOf } from "../test/testUtils.ts";
import { setAll } from "./kvSet.ts";
import { _internals } from "./kvQueue.ts";
import { abort } from "../state/state.ts";

Deno.test("kvSet - set single entry", async () => {
  const kv = await createDb();
  try {
    const entry = {
      key: ["testKey"],
      value: "testValue",
      versionstamp: "testVersionstamp",
    };
    const result = await setAll([entry], kv, "do not abort");
    assertEquals(result.failedKeys, []);
    assertEquals(result.aborted, false);
    assertEquals(result.setKeyCount, 1);
    assertGreaterOrEqual(result.writeUnitsConsumed, 1);
    assert(result.lastSuccessfulVersionstamp);

    assertEquals(await lengthOf(kv), 1);
    const setEntry = await kv.get(["testKey"]);
    assertEquals(setEntry.value, "testValue");
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvSet - set many entries", async () => {
  const kv = await createDb();
  try {
    const entries = [];
    for (let i = 0; i < 1005; i++) {
      entries.push({
        key: ["testKey-" + i],
        value: "testValue-" + i,
        versionstamp: "testVersionstamp-" + i,
      });
    }
    const result = await setAll(entries, kv, "do not abort");
    assertEquals(result.failedKeys, []);
    assertEquals(result.aborted, false);
    assertEquals(result.setKeyCount, 1005);
    assertGreaterOrEqual(result.writeUnitsConsumed, 1);
    assert(result.lastSuccessfulVersionstamp);

    assertEquals(await lengthOf(kv), 1005);
    for (let i = 0; i < 1005; i++) {
      const setEntry = await kv.get(["testKey-" + i]);
      assertEquals(setEntry.value, "testValue-" + i);
    }
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvSet - abort", async () => {
  const kv = await createDb();
  try {
    const entries = [];
    for (let i = 0; i < 100; i++) {
      entries.push({
        key: ["testKey-" + i],
        value: "testValue-" + i,
        versionstamp: "testVersionstamp-" + i,
      });
    }

    //disable queue to prevent abort cleanup from enqueueing
    _internals.enqueue = async (_msg: unknown, _delay: number) => {};

    await abort("abort");
    const result = await setAll(entries, kv, "abort");
    assertEquals(result.aborted, true);
    assertEquals(result.failedKeys, []);
    assertEquals(result.setKeyCount, 0);
    assertEquals(result.writeUnitsConsumed, 0);
    assertEquals(result.lastSuccessfulVersionstamp, undefined);
  } finally {
    await cleanup(kv);
  }
});
