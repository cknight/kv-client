import { parseKvKey } from "../kv./transform/kvKeyParser.ts";
import { assertEquals, assertThrows } from "$std/assert/mod.ts";

Deno.test("kvKeyParser - no input", () => {
  assertEquals(parseKvKey(""), []);
});

Deno.test("kvKeyParser - simple types input", () => {
  // string types
  assertEquals(parseKvKey(`"A"`), ["A"]);
  assertEquals(parseKvKey(` 'A'`), ["A"]);
  assertEquals(parseKvKey("`A` "), ["A"]);
  assertEquals(parseKvKey(`"😺"`), ["😺"]);
  assertEquals(parseKvKey(`"A😺B"`), ["A😺B"]);

  // number types
  assertEquals(parseKvKey(" 1"), [1]);
  assertEquals(parseKvKey("-1 "), [-1]);
  assertEquals(parseKvKey("1.1"), [1.1]);
  assertEquals(parseKvKey("1.0"), [1.0]);
  assertEquals(parseKvKey("0.1"), [0.1]);
  assertEquals(parseKvKey("-1.1"), [-1.1]);
  assertEquals(parseKvKey("-1.0"), [-1.0]);
  assertEquals(parseKvKey("-0.1"), [-0.1]);
  assertEquals(parseKvKey("9999999.0000001"), [9999999.0000001]);
  assertEquals(parseKvKey(Number.MAX_SAFE_INTEGER.toString()), [Number.MAX_SAFE_INTEGER]);

  // bigint types
  assertEquals(parseKvKey("1234567890123456789012345678901234567890n "), [
    1234567890123456789012345678901234567890n,
  ]);
  assertEquals(parseKvKey(" -1234567890123456789012345678901234567890n"), [
    -1234567890123456789012345678901234567890n,
  ]);

  // boolean types
  assertEquals(parseKvKey("true "), [true]);
  assertEquals(parseKvKey(" false"), [false]);

  // Unit8Array types
  assertEquals(parseKvKey("[ 205, 32,0 ]"), [new Uint8Array([205, 32, 0])]);
  assertEquals(parseKvKey("[]"), [new Uint8Array([])]);
  assertEquals(parseKvKey("[0]"), [new Uint8Array([0])]);
  assertEquals(parseKvKey("[0,9,10,99,100,199,200,239,240,249,250,255]"), [
    new Uint8Array([0, 9, 10, 99, 100, 199, 200, 239, 240, 249, 250, 255]),
  ]);
});

Deno.test("kvKeyParser - multi-types input", () => {
  assertEquals(parseKvKey(`"A", "B"`), ["A", "B"]);
  assertEquals(parseKvKey(`"A", "B", true`), ["A", "B", true]);
  assertEquals(parseKvKey(`"A", false , "B"`), ["A", false, "B"]);
  assertEquals(parseKvKey(`123n,false, "B"`), [123n, false, "B"]);
  assertEquals(parseKvKey(`true, 456, 0, "B"`), [true, 456, 0, "B"]);
  assertEquals(parseKvKey(`[1,2,3], 456, 0, "B"`), [new Uint8Array([1, 2, 3]), 456, 0, "B"]);
  assertEquals(parseKvKey(`1, [1,2,3]`), [1, new Uint8Array([1, 2, 3])]);
  assertEquals(parseKvKey(`1, 1n, true, "a", [1,2,3]`), [1, BigInt(1n), true, "a", new Uint8Array([1, 2, 3])]);
});

Deno.test("kvKeyParser - complex input", () => {
  assertEquals(parseKvKey(`"abc,def",true,"a,b,c"`), ["abc,def", true, "a,b,c"]);
  assertEquals(parseKvKey(`"\\""`), ['\\"']);
  assertEquals(parseKvKey(`"abc,def\\",\\","`), ['abc,def\\",\\",']);
  assertEquals(parseKvKey(`"abcd,ef\\",ghi"`), ['abcd,ef\\",ghi']);
});

Deno.test("kvKeyParser - invalid inputs", () => {
  assertThrows(() => parseKvKey(`abc,def`), Error, "Invalid key part: abc");
  assertThrows(() => parseKvKey(`[abc,def]`), Error, "Invalid Unit8Array: [abc,def]");
  assertThrows(() => parseKvKey(`"[abc,def]",,,,`), Error, 'Invalid key format: "[abc,def]",,,,');
  assertThrows(() => parseKvKey(`[1,]`), Error, "Invalid Unit8Array: [1,]");
  assertThrows(() => parseKvKey(`"a`), Error, 'Invalid key format: "a');
  assertThrows(() => parseKvKey(`"a'`), Error, 'Invalid key format: "a');
  assertThrows(() => parseKvKey(`"AAA"1234`), Error, 'Invalid key format: "AAA"1234');
});
