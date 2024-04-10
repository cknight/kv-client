import { assert } from "@std/assert";
import { assertEquals } from "@std/assert/assert-equals";
import { createFreshCtx } from "../../utils/test/testUtils.ts";
import { handler } from "./keyTypes.tsx";

Deno.test("Key Types - happy path", async () => {
  await assertKeyTypes("", "<empty>");
  await assertKeyTypes("'hello'", "[string]");
  await assertKeyTypes("1", "[number]");
  await assertKeyTypes("[1]", "[Uint8Array]");
  await assertKeyTypes("'hello','world'", "[string, string]");
});

Deno.test("Key Types - error path", async () => {
  await assertKeyTypes("[1,]", "<invalid>"); //extra comma
  await assertKeyTypes("[256]", "<invalid>"); //out of range
  await assertKeyTypes("hello", "<invalid>"); //no quotes
});

async function assertKeyTypes(keyString: string, expectedResponse: string) {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/keyTypes", {
    method: "POST",
    body: keyString,
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  assertEquals(resp.status, 200);
  assertEquals(await resp.text(), expectedResponse);
  return resp;
}
