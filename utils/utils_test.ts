import { assertEquals } from "$std/assert/assert_equals.ts";
import { fromJSON, toJSON } from "./utils.ts";

Deno.test("unit8 serialisation", () => {
  const test = new Uint8Array([1, 2, 3, 4, 5]);
  const json = toJSON(test);

  assertEquals(json, '"__u8__1,2,3,4,5"');
  const result = fromJSON(json);
  assertEquals(result, test);
});

Deno.test("bigint serialisation", () => {
  const test = 1234567890123456789012345678901234567890n;
  const json = toJSON(test);

  assertEquals(json, '"__bi__1234567890123456789012345678901234567890"');
  const result = fromJSON(json);
  assertEquals(result, test);
});

Deno.test("Deno KvKey serialisation/deserialisation", () => {
  testKey([]);
  testKey([""]);
  testKey(["hello world"]);
  testKey([new Uint8Array([1, 2, 3, 4, 5])]);
  testKey([1234]);
  testKey([1234567890123456789012345678901234567890n]);
  testKey([true]);
  testKey([false]);
  testKey([
    "[1,2,3]",
    new Uint8Array([255, 0, 0]),
    0,
    -1,
    Number.MAX_SAFE_INTEGER,
    "123n",
    true,
    false,
  ]);
});

function testKey(key: Deno.KvKey) {
  const json = toJSON(key);
  const result = fromJSON(json);
  assertEquals(result, key);
}
