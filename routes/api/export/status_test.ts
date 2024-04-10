import { assert } from "@std/assert";
import { assertEquals } from "@std/assert/assert-equals";
import { updateExportStatus } from "../../../utils/state/state.ts";
import { createFreshCtx, SESSION_ID } from "../../../utils/test/testUtils.ts";
import { handler } from "./status.tsx";

Deno.test("No export id supplied returns 400", async () => {
  assert(handler.GET);

  const request = new Request("http://localhost:8080/api/export/status");
  const ctx = createFreshCtx(request);
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No exportId provided");
});

Deno.test("No status found returns 400", async () => {
  assert(handler.GET);

  const request = new Request("http://localhost:8080/api/export/status?exportId=123");
  const ctx = createFreshCtx(request);
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No status found");
});

Deno.test("Status is returned", async () => {
  assert(handler.GET);
  await updateExportStatus(
    "123",
    { status: "complete", keysProcessed: 0, bytesProcessed: 0 },
    SESSION_ID,
  );
  const request = new Request("http://localhost:8080/api/export/status?exportId=123");
  const ctx = createFreshCtx(request);
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 200);
  assertEquals(await resp.json(), { status: "complete", keysProcessed: 0, bytesProcessed: 0 });
});
