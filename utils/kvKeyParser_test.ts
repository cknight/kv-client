import { parseKvKey } from "./kvKeyParser.ts";
import { assertEquals } from "$std/assert/mod.ts";

Deno.test("kvKeyParser", () => {
  assertEquals(parseKvKey(``), []);
  assertEquals(parseKvKey(""), []);
  assertEquals(parseKvKey(''), []); 
  assertEquals(parseKvKey(`"A"`), ["A"]);
  assertEquals(parseKvKey(`'A'`), ["A"]);
  assertEquals(parseKvKey("`A`"), ["A"]);
  assertEquals(parseKvKey(`"A", "B"`), ["A", "B"]);
  assertEquals(parseKvKey(`"A", "B", true`), ["A", "B", true]);
  assertEquals(parseKvKey(`"A", false, "B"`), ["A", false, "B"]);
  assertEquals(parseKvKey(`123n, false, "B"`), [123n, false, "B"]);
  assertEquals(parseKvKey(`true, 456, 0, "B"`), [true, 456, 0, "B"]);
});