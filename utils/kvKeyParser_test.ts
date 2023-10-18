import { parseKvKey } from "./kvKeyParser.ts";
import { assertEquals } from "$std/assert/mod.ts";

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
  assertEquals(parseKvKey("1234567890123456789012345678901234567890n "), [1234567890123456789012345678901234567890n]);
  assertEquals(parseKvKey(" -1234567890123456789012345678901234567890n"), [-1234567890123456789012345678901234567890n]);

  // boolean types
  assertEquals(parseKvKey("true "), [true]);
  assertEquals(parseKvKey(" false"), [false]);

  // Unit8Array types
  assertEquals(parseKvKey("[ 205, 32,0 ]"), [new Uint8Array([205, 32, 0])]);
});

Deno.test("kvKeyParser - multi-types input", () => {
  assertEquals(parseKvKey(`"A", "B"`), ["A", "B"]);
  assertEquals(parseKvKey(`"A", "B", true`), ["A", "B", true]);
  assertEquals(parseKvKey(`"A", false , "B"`), ["A", false, "B"]);
  assertEquals(parseKvKey(`123n,false, "B"`), [123n, false, "B"]);
  assertEquals(parseKvKey(`true, 456, 0, "B"`), [true, 456, 0, "B"]);
  assertEquals(parseKvKey(`[1,2,3], 456, 0, "B"`), [new Uint8Array([1,2,3]), 456, 0, "B"]);
});

Deno.test("kvKeyParser - complex input", () => {
  assertEquals(parseKvKey(`"abc,def",true,"a,b,c"`), ["abc,def", true, "a,b,c"]);
  assertEquals(parseKvKey(`"\\""`), ["\\\""]);
  assertEquals(parseKvKey(`"abc,def\\",\\","`), ["abc,def\\\",\\\","]);
  assertEquals(parseKvKey(`"abcd,ef\\",ghi"`), ["abcd,ef\\\",ghi"]);
});