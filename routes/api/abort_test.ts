import { assert } from "$std/assert/assert.ts";
import { createFreshContext } from "$fresh-testing-library/server.ts";
import { handler } from "./abort.tsx";
import manifest from "../../fresh.gen.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { assertFalse } from "$std/assert/assert_false.ts";
import { shouldAbort } from "../../utils/state/state.ts";
import { disableQueue } from "../../utils/test/testUtils.ts";

Deno.test("No abort id supplied returns 400", async () => {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/abort");
  const ctx = createFreshContext(request, { manifest });
  const resp = await handler.POST(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No abortId provided");
});

Deno.test("Abort is called", async () => {
  assert(handler.POST);

  disableQueue();
  assertFalse(shouldAbort("123"));
  const request = new Request("http://localhost:8080/api/abort", {
    method: "POST",
    body: "123",
  });
  const ctx = createFreshContext(request, { manifest });
  const resp = await handler.POST(request, ctx);
  assertEquals(resp.status, 200);
  assertEquals(await resp.text(), "");
  assertEquals(shouldAbort("123"), true);
});
