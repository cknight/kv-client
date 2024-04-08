import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { CONNECTIONS_KEY_PREFIX } from "../consts.ts";
import { KvConnection } from "../types.ts";
import { localKv } from "../utils/kv/db.ts";
import { cleanup, createDb, createFreshCtx, DB_ID, DB_PATH } from "../utils/test/testUtils.ts";
import { shortHash } from "../utils/utils.ts";
import { handler } from "./addLocalConnection.tsx";

Deno.test("addLocalConnection - happy path load page", async () => {
  const resp = await callGETHandler();
  assertEquals(resp.status, 200);

  const html = await resp.text();
  console.log(html);
  // Check output contains at least one radio button
  assert(html.includes(`name="localLocation"`));
});

Deno.test("addLocalConnection - happy path submit form", async () => {
  const kv = await createDb();
  await localKv.delete([CONNECTIONS_KEY_PREFIX, DB_ID]);

  try {
    const resp = await callPOSTHandler("connName", DB_PATH);
    assertEquals(resp.status, 303);
    assertEquals(resp.headers.get("Location"), "/");
    const conn = await localKv.get<KvConnection>([CONNECTIONS_KEY_PREFIX, DB_ID]);
    assertEquals(conn.value?.name, "connName");
    assertEquals(conn.value?.kvLocation, DB_PATH);
    assertEquals(conn.value?.environment, "local");
    assertEquals(conn.value?.id, DB_ID);
    assertEquals(conn.value?.infra, "local");
    assert(conn.value?.size && conn.value.size > 0);
  } finally {
    await cleanup(kv);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, await shortHash(DB_PATH)]);
  }
});

Deno.test("addLocalConnection - no connection name", async () => {
  const resp = await callPOSTHandler("", DB_PATH);
  assertEquals(resp.status, 200);
  assert((await resp.text()).includes("Enter a connection name"));
});

Deno.test("addLocalConnection - no connection location", async () => {
  const resp = await callPOSTHandler("connName", "");
  assertEquals(resp.status, 200);
  assert((await resp.text()).includes("Enter a connection location"));
});

Deno.test("addLocalConnection - connection name already exists", async () => {
  const kv = await createDb();
  try {
    await localKv.set([CONNECTIONS_KEY_PREFIX, DB_ID], {
      name: "connName",
      kvLocation: DB_PATH,
      environment: "local",
      id: DB_ID,
      infra: "local",
      size: 100,
    });
    const resp = await callPOSTHandler("connName", DB_PATH);
    assertEquals(resp.status, 200);
    assert((await resp.text()).includes("A connection with this name already exists"));
  } finally {
    await cleanup(kv);
  }
});

Deno.test("addLocalConnection - invalid connection location", async () => {
  const resp = await callPOSTHandler("connName", "invalidPath");
  assertEquals(resp.status, 200);
  assert((await resp.text()).includes("No such file or directory"));
});

Deno.test("addLocalConnection - invalid connection location - not a KV store", async () => {
  console.log(import.meta);
  const resp = await callPOSTHandler("connName", import.meta.filename!);
  assertEquals(resp.status, 200);
  assert((await resp.text()).includes("file is not a database"));
});

async function callPOSTHandler(connName: string, connLocation: string) {
  assert(handler.POST);

  const requestData = new FormData();
  requestData.append("connectionName", connName);
  requestData.append("connectionLocation", connLocation);

  const request = new Request("http://localhost:8080/addLocalConnection", {
    method: "POST",
    body: requestData,
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  return resp;
}

async function callGETHandler() {
  assert(handler.GET);

  const request = new Request("http://localhost:8080/addLocalConnection");
  const ctx = createFreshCtx(request);
  const resp = await handler.GET(request, ctx);
  return resp;
}
