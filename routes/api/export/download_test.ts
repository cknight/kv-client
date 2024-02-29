import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { EXPORT_PATH } from "../../../consts.ts";
import { localKv } from "../../../utils/kv/db.ts";
import { updateExportStatus } from "../../../utils/state/state.ts";
import { createFreshCtx, SESSION_ID } from "../../../utils/test/testUtils.ts";
import { handler } from "./download.tsx";

const test = Deno.test;

test("No export id supplied returns 400", async () => {
  assert(handler.GET);

  const request = new Request("http://localhost:8080/api/export/download");
  const ctx = createFreshCtx(request);
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No export id provided");
});

test("No export found for id returns 400", async () => {
  assert(handler.GET);

  const request = new Request("http://localhost:8080/api/export/download?exportId=123");
  const ctx = createFreshCtx(request);
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No export found for id 123");
});

test("Export still in progress returns 400", async () => {
  assert(handler.GET);

  await updateExportStatus(
    "123",
    { status: "in progress", keysProcessed: 0, bytesProcessed: 0 },
    SESSION_ID,
  );
  const request = new Request("http://localhost:8080/api/export/download?exportId=123");
  const ctx = createFreshCtx(request);
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "Export still in progress");
});

test("No export file found returns 400", async () => {
  assert(handler.GET);

  await updateExportStatus(
    "123",
    { status: "complete", keysProcessed: 0, bytesProcessed: 0 },
    SESSION_ID,
  );
  const request = new Request("http://localhost:8080/api/export/download?exportId=123");
  const ctx = createFreshCtx(request);
  const resp = await handler.GET(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No export file found");
});

test("Export file is streamed back", async () => {
  let tempFilePath = "";
  try {
    assert(handler.GET);

    tempFilePath = await Deno.makeTempFile();
    await localKv.set([EXPORT_PATH, SESSION_ID, "123"], tempFilePath);

    await updateExportStatus(
      "123",
      { status: "complete", keysProcessed: 0, bytesProcessed: 0 },
      SESSION_ID,
    );
    const request = new Request("http://localhost:8080/api/export/download?exportId=123");
    const ctx = createFreshCtx(request);
    const resp = await handler.GET(request, ctx);
    assertEquals(resp.status, 200);
    // Check that the body is a ReadableStream (and then cancel it to avoid memory leaks)
    assert(resp.body instanceof ReadableStream);
    resp.body.cancel();
  } finally {
    await localKv.delete([EXPORT_PATH, SESSION_ID, "123"]);
    await Deno.remove(tempFilePath);
  }
});
