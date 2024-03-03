import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { logout } from "../../utils/connections/denoDeploy/logout.ts";
import { localKv } from "../../utils/kv/db.ts";
import { SESSION_ID, addTestConnection, createFreshCtx } from "../../utils/test/testUtils.ts";
import { handler } from "./removeConnection.tsx";

Deno.test("Remove connection - happy path", async () => {
  try {
    await addTestConnection("some/location/kv.db", "123");
    const formData = new FormData();
    formData.append("connectionId", "123");
  
    const preEntry = await localKv.get<KvConnection>([CONNECTIONS_KEY_PREFIX, "123"]);
    assertEquals(preEntry.value?.kvLocation, "some/location/kv.db");
  
    const resp = await callAPI("123");
    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), "");

    const postEntry = await localKv.get<KvConnection>([CONNECTIONS_KEY_PREFIX, "123"]);
    assertEquals(postEntry.value, null);
  } finally {
    await localKv.delete([CONNECTIONS_KEY_PREFIX, "123"]);
    await logout(SESSION_ID);
  }
});

Deno.test("Remove connection - no connectionId", async () => {
  const resp = await callAPI(undefined);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "Invalid connection id supplied");
});

async function callAPI(connectionId: string | undefined) {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/removeConnection", {
    method: "POST",
    body: connectionId ? JSON.stringify({ connectionId }) : JSON.stringify({}),
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  return resp;
}
