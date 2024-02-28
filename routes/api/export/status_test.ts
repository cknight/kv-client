import { assert } from "$std/assert/assert.ts";
import { createFreshContext } from "$fresh-testing-library/server.ts";
import { handler } from "./status.tsx";
import manifest from "../../../fresh.gen.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { updateExportStatus } from "../../../utils/state/state.ts";

Deno.test("No export id supplied returns 400", async () => {
  assert(handler.GET);

  const request = new Request("http://localhost:8080/api/export/status");
  const ctx = createFreshContext(request, { manifest });
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No exportId provided");
});

Deno.test("No status found returns 400", async () => {
  assert(handler.GET);

  const request = new Request("http://localhost:8080/api/export/status?exportId=123");
  const ctx = createFreshContext(request, { manifest });
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No status found");
});

Deno.test("Status is returned", async () => {
  assert(handler.GET);
  updateExportStatus("123", { status: "complete", keysProcessed: 0, bytesProcessed: 0 }, "session");
  const request = new Request("http://localhost:8080/api/export/status?exportId=123");
  const state = { session: "session" };
  const ctx = createFreshContext<void, typeof state>(request, { manifest, state });
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 200);
  assertEquals(await resp.json(), { status: "complete", keysProcessed: 0, bytesProcessed: 0 });
});