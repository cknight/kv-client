import { assert } from "@std/assert";
import { assertEquals } from "@std/assert/assert-equals";
import { assertFalse } from "@std/assert";
import { shouldAbort } from "../../utils/state/state.ts";
import { createFreshCtx, disableQueue } from "../../utils/test/testUtils.ts";
import { handler } from "./abort.tsx";

Deno.test("No abort id supplied returns 400", async () => {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/abort");
  const ctx = createFreshCtx(request);
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
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  assertEquals(resp.status, 200);
  assertEquals(await resp.text(), "");
  assertEquals(shouldAbort("123"), true);
});
