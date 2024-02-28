import { handler } from "./download.tsx";
import { createFreshContext } from "$fresh-testing-library/server.ts";
import manifest from "../../../fresh.gen.ts";
import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { updateExportStatus } from "../../../utils/state/state.ts";
import { localKv } from "../../../utils/kv/db.ts";
import { EXPORT_PATH } from "../../../consts.ts";

const test = Deno.test;

test("No export id supplied returns 400", async () => {
  assert(handler.GET);

  const request = new Request("http://localhost:8080/api/export/download");
  const ctx = createFreshContext(request, { manifest });
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No export id provided");
});

test("No export found for id returns 400", async () => {
  assert(handler.GET);

  const request = new Request("http://localhost:8080/api/export/download?exportId=123");
  const ctx = createFreshContext(request, { manifest });
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No export found for id 123");
});

test("Export still in progress returns 400", async () => {
  assert(handler.GET);

  await updateExportStatus(
    "123",
    { status: "in progress", keysProcessed: 0, bytesProcessed: 0 },
    "session",
  );
  const request = new Request("http://localhost:8080/api/export/download?exportId=123");
  const ctx = createFreshContext(request, { manifest });
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "Export still in progress");
});

test("No export file found returns 400", async () => {
  assert(handler.GET);

  await updateExportStatus("123", { status: "complete", keysProcessed: 0, bytesProcessed: 0 }, "session");
  const request = new Request("http://localhost:8080/api/export/download?exportId=123");
  const state = { session: "session" };
  const ctx = createFreshContext<void, typeof state>(request, { manifest, state });
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No export file found");
});

test("Export file is streamed back", async () => {
  let tempFilePath = "";
  try {
    assert(handler.GET);

    tempFilePath = await Deno.makeTempFile();
    await localKv.set([EXPORT_PATH, "session", "123"], tempFilePath);
  
    await updateExportStatus("123", { status: "complete", keysProcessed: 0, bytesProcessed: 0 }, "session");
    const request = new Request("http://localhost:8080/api/export/download?exportId=123");
    const state = { session: "session" };
    const ctx = createFreshContext<void, typeof state>(request, { manifest, state });
    const resp = await handler.GET(request, ctx);
    assertEquals(resp.status, 200);
    // Check that the body is a ReadableStream (and then cancel it to avoid memory leaks)
    assert(resp.body instanceof ReadableStream);
    resp.body.cancel();
  } finally {
      await localKv.delete([EXPORT_PATH, "session", "123"]);
      await Deno.remove(tempFilePath);
  }
});
