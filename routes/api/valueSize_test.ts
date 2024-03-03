import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { createFreshCtx } from "../../utils/test/testUtils.ts";
import { KvValueJson } from "./valueSize.tsx";
import { handler } from "./valueSize.tsx";

Deno.test("Value size - happy path", async () => {
  const resp = await callAPI("test string");
  assertEquals(resp.status, 200);
  assertEquals(await resp.text(), "15 B");
});

Deno.test("Value size - empty string", async () => {
  const resp = await callAPI("");
  assertEquals(resp.status, 200);
  assertEquals(await resp.text(), "4 B");
});

Deno.test("Value size - invalid value type", async () => {
  const resp = await callAPI("test string", "number");
  assertEquals(resp.status, 422);
  assertEquals(await resp.text(), "Invalid value");
});

async function callAPI(valueString: string, valueType: string = "string") {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/valueSize", {
    method: "POST",
    body: JSON.stringify({valueString, valueType} as KvValueJson),
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  return resp;
}
