import { assertEquals } from "$std/assert/assert_equals.ts";
import { assertThrows } from "$std/assert/assert_throws.ts";
import { ValidationError } from "../errors.ts";
import { buildKvValue } from "./kvValueParser.ts";

Deno.test("string", () => {
  assertEquals(buildKvValue("", "string"), "");
  assertEquals(buildKvValue("abc", "string"), "abc");
});

Deno.test("bigint match", () => {
  assertEquals(buildKvValue("0", "bigint"), BigInt(0));
  assertEquals(buildKvValue("1", "bigint"), BigInt(1));
  assertEquals(buildKvValue("-1", "bigint"), BigInt(-1));
  assertEquals(
    buildKvValue("123456789012345678901234567890", "bigint"),
    BigInt("123456789012345678901234567890"),
  );
});

Deno.test("bigint reject", () => {
  assertThrows(() => buildKvValue("abc", "bigint"), ValidationError, "Value is not a bigint");
});

Deno.test("boolean", () => {
  assertEquals(buildKvValue("true", "boolean"), true);
  assertEquals(buildKvValue("false", "boolean"), false);
});

Deno.test("boolean reject", () => {
  assertThrows(() => buildKvValue("abc", "boolean"), ValidationError, "Value is not true or false");
});

Deno.test("null", () => {
  assertEquals(buildKvValue("null", "null"), null);
});

Deno.test("null reject", () => {
  assertThrows(() => buildKvValue("abc", "null"), ValidationError, "Value is not null");
});

Deno.test("number", () => {
  assertEquals(buildKvValue("0", "number"), 0);
  assertEquals(buildKvValue("1", "number"), 1);
  assertEquals(buildKvValue("-1", "number"), -1);
  assertEquals(buildKvValue("0.1", "number"), 0.1);
  assertEquals(buildKvValue("-0.1", "number"), -0.1);
  assertEquals(buildKvValue("1e10", "number"), 1e10);
  assertEquals(buildKvValue("1e-10", "number"), 1e-10);
  assertEquals(buildKvValue("1.1e10", "number"), 1.1e10);
  assertEquals(buildKvValue("1.1e-10", "number"), 1.1e-10);
});

Deno.test("number reject", () => {
  assertThrows(() => buildKvValue("abc", "number"), ValidationError, "Value is not a number");
});

Deno.test("Array", () => {
  assertEquals(buildKvValue("[]", "Array"), []);
  assertEquals(buildKvValue("[1,2,3]", "Array"), [1, 2, 3]);
  assertEquals(buildKvValue("[ 1,2 , 3 ]", "Array"), [1, 2, 3]);
  assertEquals(buildKvValue("['a','b','c']", "Array"), ["a", "b", "c"]);
});

Deno.test("Array reject", () => {
  assertThrows(
    () => buildKvValue("abc", "Array"),
    ValidationError,
    "Invalid Array: JSON5: invalid character 'a' at 1:1",
  );
  assertThrows(() => buildKvValue("", "Array"), ValidationError, "Value is not a Array");
  assertThrows(() => buildKvValue("{}", "Array"), ValidationError, "Value is not a Array");
});

Deno.test("Date", () => {
  assertEquals(
    buildKvValue("2020-01-01T00:00:00.000Z", "Date"),
    new Date("2020-01-01T00:00:00.000Z"),
  );
  assertEquals(
    buildKvValue('{ type: "Date", value: "2020-01-01T00:00:00.000Z"}', "Date"),
    new Date("2020-01-01T00:00:00.000Z"),
  );
});

Deno.test("Date reject", () => {
  assertThrows(() => buildKvValue("abc", "Date"), ValidationError, "Value is not a valid Date");
  assertThrows(
    () => buildKvValue('{ type: "Date", value: "2020-99-01T00:00:00.000Z"}', "Date"),
    ValidationError,
    "Value is not a valid Date",
  );
});

Deno.test("JSON", () => {
  assertEquals(buildKvValue("{}", "JSON"), "{}");
  assertEquals(buildKvValue('{ "a": 1 }', "JSON"), '{ "a": 1 }');
});

Deno.test("JSON reject", () => {
  assertThrows(
    () => buildKvValue("abc", "JSON"),
    ValidationError,
    "Invalid JSON: Unexpected token 'a', \"abc\" is not valid JSON",
  );
  assertThrows(
    () => buildKvValue("{ a: 1 }", "JSON"),
    ValidationError,
    "Invalid JSON: Expected property name or '}' in JSON at position 2 (line 1 column 3)",
  );
  assertThrows(
    () => buildKvValue("", "JSON"),
    ValidationError,
    "Invalid JSON: Unexpected end of JSON input",
  );
});

Deno.test("KvU64", () => {
  assertEquals(buildKvValue("0", "KvU64"), new Deno.KvU64(0n));
  assertEquals(buildKvValue("1", "KvU64"), new Deno.KvU64(1n));
  assertEquals(
    buildKvValue("18446744073709551615", "KvU64"),
    new Deno.KvU64(18446744073709551615n),
  );
});

Deno.test("KvU64 reject", () => {
  assertThrows(() => buildKvValue("-1", "KvU64"), ValidationError, "Value is not a valid KvU64");
  assertThrows(
    () => buildKvValue("18446744073709551616", "KvU64"),
    ValidationError,
    "value must fit in a 64-bit unsigned integer",
  );
  assertThrows(
    () => buildKvValue("abc", "KvU64"),
    ValidationError,
    "Invalid KvU64: JSON5: invalid character 'a' at 1:1",
  );
});

Deno.test("Map", () => {
  assertEquals(buildKvValue("[]", "Map"), new Map());
  assertEquals(buildKvValue('[["a", 1],["b", 2]]', "Map"), new Map([["a", 1], ["b", 2]]));
});

Deno.test("Map reject", () => {
  assertThrows(
    () => buildKvValue("abc", "Map"),
    ValidationError,
    "Invalid Map: JSON5: invalid character 'a' at 1:23",
  );
  assertThrows(() => buildKvValue("", "Map"), ValidationError, "Value is not a Map");
  assertThrows(() => buildKvValue("{}", "Map"), ValidationError, "Invalid Map: Invalid Map value");
});

Deno.test("Set", () => {
  assertEquals(buildKvValue("[]", "Set"), new Set());
  assertEquals(buildKvValue("[1,2,3]", "Set"), new Set([1, 2, 3]));
  assertEquals(
    buildKvValue('[\'a\',{type: "bigint", value: "2"},true]', "Set"),
    new Set(["a", 2n, true]),
  );
});

Deno.test("Set reject", () => {
  assertThrows(
    () => buildKvValue("abc", "Set"),
    ValidationError,
    "Invalid Set: JSON5: invalid character 'a' at 1:23",
  );
  assertThrows(() => buildKvValue("", "Set"), ValidationError, "Value is not a Set");
  assertThrows(() => buildKvValue("{}", "Set"), ValidationError, "Invalid Set: Invalid Set value");
});

Deno.test("Object", () => {
  assertEquals(buildKvValue("{}", "Object"), {});
  assertEquals(buildKvValue('{ "a": 1 }', "Object"), { a: 1 });
  assertEquals(buildKvValue('{ "a": {type: "bigint", value: "2"} }', "Object"), { a: 2n });
  assertEquals(
    buildKvValue('{ a: [{type: "bigint", value: "2"}, {type: "Set", value: [1,2,3]}] }', "Object"),
    { a: [2n, new Set([1, 2, 3])] },
  );
});

Deno.test("Object reject", () => {
  assertThrows(
    () => buildKvValue("abc", "Object"),
    ValidationError,
    "Invalid Object: JSON5: invalid character 'a' at 1:1",
  );
  assertThrows(() => buildKvValue("", "Object"), ValidationError, "Value is not a Object");
  assertThrows(() => buildKvValue("[]", "Object"), ValidationError, "Value is not a Object");
});

Deno.test("RegExp", () => {
  assertEquals(buildKvValue("/abc/g", "RegExp"), /abc/g);
  assertEquals(
    buildKvValue('/^\\s*\\{\\s*type:\\s*"RegExp"\\s*,\\s*value:/', "RegExp"),
    /^\s*\{\s*type:\s*"RegExp"\s*,\s*value:/,
  );
  assertEquals(buildKvValue('{ type: "RegExp", value: "/abc/g"}', "RegExp"), /abc/g);
});

Deno.test("RegExp reject", () => {
  assertThrows(
    () => buildKvValue('{ type: "string", value: "/abc/g"}', "RegExp"),
    ValidationError,
    "Invalid RegExp: Invalid flags supplied to RegExp constructor 'g\"}'",
  );
  assertThrows(
    () => buildKvValue('{ type: "RegExp", value: "abc"}', "RegExp"),
    ValidationError,
    "Invalid RegExp",
  );
  assertThrows(() => buildKvValue("abc", "RegExp"), ValidationError, "Invalid RegExp");
});

Deno.test("Uint8Array", () => {
  assertEquals(buildKvValue("[]", "Uint8Array"), new Uint8Array([]));
  assertEquals(buildKvValue("[1,2,3]", "Uint8Array"), new Uint8Array([1, 2, 3]));
  assertEquals(
    buildKvValue('{ type: "Uint8Array", value: [1,2,3]}', "Uint8Array"),
    new Uint8Array([1, 2, 3]),
  );
});

Deno.test("Uint8Array reject", () => {
  assertThrows(
    () => buildKvValue("abc", "Uint8Array"),
    ValidationError,
    "Invalid Uint8Array: JSON5: invalid character 'a' at 1:1",
  );
  assertThrows(
    () => buildKvValue("", "Uint8Array"),
    ValidationError,
    "Invalid Uint8Array: JSON5: invalid end of input at 1:1",
  );
  assertThrows(
    () => buildKvValue("{}", "Uint8Array"),
    ValidationError,
    "Invalid Uint8Array: Value is not a valid Uint8Array",
  );
  assertThrows(
    () => buildKvValue("['1', '2']", "Uint8Array"),
    ValidationError,
    "Invalid Uint8Array: Value is not a valid Uint8Array",
  );
});
