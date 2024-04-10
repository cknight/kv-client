import { assertEquals } from "@std/assert/assert-equals";
import { asPercentString } from "./display.ts";

Deno.test("Display", () => {
  assertEquals(asPercentString(0.123456), "12%");
  assertEquals(asPercentString(1), "100%");
  assertEquals(asPercentString(0), "0%");
  assertEquals(asPercentString(0.01), "1%");
  assertEquals(asPercentString(0.01999999), "2%");
});
