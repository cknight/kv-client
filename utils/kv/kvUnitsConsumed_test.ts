import { assertEquals } from "@std/assert/assert-equals";
import { computeSize, readUnitsConsumed, writeUnitsConsumed } from "./kvUnitsConsumed.ts";

Deno.test("computeSize", () => {
  let size = computeSize(["test key"], "value");
  assertEquals(size, 26);

  size = computeSize(["test key"], null);
  assertEquals(size, 20);

  size = computeSize([new Uint8Array([1, 2, 3])], new Uint8Array([4, 5, 6]));
  assertEquals(size, 29);
});

Deno.test("readUnitsConsumed", () => {
  let units = readUnitsConsumed(0);
  assertEquals(units, 0);

  units = readUnitsConsumed(1);
  assertEquals(units, 1);

  units = readUnitsConsumed(1024 * 4);
  assertEquals(units, 1);

  units = readUnitsConsumed(1024 * 4 + 1);
  assertEquals(units, 2);
});

Deno.test("writeUnitsConsumed", () => {
  let units = writeUnitsConsumed(0);
  assertEquals(units, 0);

  units = writeUnitsConsumed(1);
  assertEquals(units, 1);

  units = writeUnitsConsumed(1024);
  assertEquals(units, 1);

  units = writeUnitsConsumed(1024 + 1);
  assertEquals(units, 2);
});
