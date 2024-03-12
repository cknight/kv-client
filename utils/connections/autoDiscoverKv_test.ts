import { assertGreaterOrEqual } from "$std/assert/assert_greater_or_equal.ts";
import { assert } from "$std/assert/assert.ts";
import { localKv } from "../kv/db.ts";
import { SESSION_ID } from "../test/testUtils.ts";
import { peekAtLocalKvInstances } from "./autoDiscoverKv.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";

Deno.test("autoDiscoverKv - happy path", async() => {
  //set top 4 entries
  await localKv.set([new Uint8Array([0])], "first");
  await localKv.set([new Uint8Array([1])], "second");
  await localKv.set([new Uint8Array([2])], "third");
  await localKv.set([new Uint8Array([3])], "not shown");

  //set bottom 4 entries
  await localKv.set([9n], "last");
  await localKv.set([8n], "second last");
  await localKv.set([7n], "third last");
  await localKv.set([6n], "not shown");

  //set middle 4 entries in case this KV instance is empty
  await localKv.set(["middle-1"], "not shown");
  await localKv.set(["middle-2"], "not shown");
  await localKv.set(["middle-3"], "not shown");
  await localKv.set(["middle-4"], "not shown");

  try {
    const instances = await peekAtLocalKvInstances(SESSION_ID);
    assertGreaterOrEqual(instances.length, 1);
    let found = false;
    instances.forEach((instance) => {
      if (instance.dataSelection.length > 0) {
        if (instance.dataSelection[0].value === "first") {
          found = true;
          assertEquals(instance.dataSelection.length, 6);
          assertEquals(instance.dataSelection[0].value, "first");
          assertEquals(instance.dataSelection[1].value, "second");
          assertEquals(instance.dataSelection[2].value, "third");
          assertEquals(instance.dataSelection[3].value, "last");
          assertEquals(instance.dataSelection[4].value, "second last");
          assertEquals(instance.dataSelection[5].value, "third last");
        }
      }
    });
    assert(found);
  } finally {
    await localKv.delete([new Uint8Array([0])]);
    await localKv.delete([new Uint8Array([1])]);
    await localKv.delete([new Uint8Array([2])]);
    await localKv.delete([new Uint8Array([3])]);
    await localKv.delete([9n]);
    await localKv.delete([8n]);
    await localKv.delete([7n]);
    await localKv.delete([6n]);
    await localKv.delete(["middle-1"]);
    await localKv.delete(["middle-2"]);
    await localKv.delete(["middle-3"]);
    await localKv.delete(["middle-4"]);
  }
});