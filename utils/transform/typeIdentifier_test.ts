import { assertEquals } from "$std/assert/assert_equals.ts";
import { identifyType } from "./typeIdentifier.ts";

Deno.test("typeIdentifier", () => {
  assertEquals(identifyType(undefined), "undefined");
  assertEquals(identifyType(null), "null");
  assertEquals(identifyType(true), "boolean");
  assertEquals(identifyType(false), "boolean");
  assertEquals(identifyType(0), "number");
  assertEquals(identifyType(1), "number");
  assertEquals(identifyType(1.1), "number");
  assertEquals(identifyType(1n), "bigint");
  assertEquals(identifyType(-1n), "bigint");
  assertEquals(identifyType("a"), "string");
  assertEquals(identifyType(Symbol("a")), "symbol");
  assertEquals(identifyType({}), "object");
  assertEquals(identifyType([]), "Array");
  assertEquals(identifyType(new Map()), "Map");
  assertEquals(identifyType(new Set()), "Set");
  assertEquals(identifyType(new Date()), "Date");
  assertEquals(identifyType(new RegExp("a")), "RegExp");
  assertEquals(identifyType(new Uint8Array()), "Uint8Array");
  assertEquals(identifyType(new Deno.KvU64(1234n)), "KvU64");
});
