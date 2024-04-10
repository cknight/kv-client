import { assert } from "@std/assert";
import { assertEquals } from "@std/assert/assert-equals";
import { CONNECTIONS_KEY_PREFIX, ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX } from "../consts.ts";
import { KvConnection } from "../types.ts";
import { localKv } from "../utils/kv/db.ts";
import { cleanup, createFreshCtx } from "../utils/test/testUtils.ts";
import { EncryptedData } from "../utils/transform/encryption.ts";
import { shortHash } from "../utils/utils.ts";
import { _internals, handler } from "./addSelfHostedConnection.tsx";

const SELF_HOSTED_LOCATION = "https://my.site.com/db";
const LOCATION_HASH = await shortHash(SELF_HOSTED_LOCATION);
const ACCESS_TOKEN = "accessToken123";

Deno.test("addSelfHostedConnection - happy path submit form", async () => {
  _internals.validateConnection = async () => {/* Do nothing */};
  console.log("chris", (await localKv.get([CONNECTIONS_KEY_PREFIX, LOCATION_HASH])).value);
  try {
    const resp = await callPOSTHandler("connName2", SELF_HOSTED_LOCATION, ACCESS_TOKEN);
    const body = await resp.text();
    console.log(body);
    assertEquals(resp.status, 303);
    assertEquals(resp.headers.get("Location"), "/");
    const conn = await localKv.get<KvConnection>([CONNECTIONS_KEY_PREFIX, LOCATION_HASH]);
    assertEquals(conn.value?.name, "connName2");
    assertEquals(conn.value?.kvLocation, SELF_HOSTED_LOCATION);
    assertEquals(conn.value?.environment, "self-hosted");
    assertEquals(conn.value?.id, LOCATION_HASH);
    assertEquals(conn.value?.infra, "self-hosted");
    assertEquals(conn.value?.size, -1);
    const token = await localKv.get<EncryptedData>([
      ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX,
      LOCATION_HASH,
    ]);
    assert(token.value!.cipherText.length > 0);
  } finally {
    await localKv.delete([ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX, LOCATION_HASH]);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, LOCATION_HASH]);
    await cleanup();
  }
});

Deno.test("addLocalConnection - no connection name", async () => {
  const resp = await callPOSTHandler("", SELF_HOSTED_LOCATION, ACCESS_TOKEN);
  assertEquals(resp.status, 200);
  assert((await resp.text()).includes("Enter a connection name"));
});

Deno.test("addLocalConnection - no connection location", async () => {
  const resp = await callPOSTHandler("connName", "", ACCESS_TOKEN);
  assertEquals(resp.status, 200);
  assert((await resp.text()).includes("Enter a connection location"));
});

Deno.test("addLocalConnection - no access token", async () => {
  const resp = await callPOSTHandler("connName", SELF_HOSTED_LOCATION, "");
  assertEquals(resp.status, 200);
  assert((await resp.text()).includes("Enter an access token"));
});

Deno.test("addLocalConnection - invalid connection location", async () => {
  const resp = await callPOSTHandler("connName", "invalidPath", ACCESS_TOKEN);
  assertEquals(resp.status, 200);
  assert(
    (await resp.text()).includes(
      "Connection location must be URL starting with http:// or https://",
    ),
  );
});

Deno.test("addLocalConnection - connection name already exists", async () => {
  try {
    await localKv.set([CONNECTIONS_KEY_PREFIX, LOCATION_HASH], {
      name: "connName",
      kvLocation: SELF_HOSTED_LOCATION,
      environment: "self-hosted",
      id: LOCATION_HASH,
      infra: "self-hosted",
      size: -1,
    });
    const resp = await callPOSTHandler("connName", SELF_HOSTED_LOCATION, ACCESS_TOKEN);
    assertEquals(resp.status, 200);
    assert((await resp.text()).includes("A connection with this name already exists"));
  } finally {
    await cleanup();
    await localKv.delete([ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX, LOCATION_HASH]);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, LOCATION_HASH]);
  }
});

async function callPOSTHandler(connName: string, connLocation: string, accessToken: string) {
  assert(handler.POST);

  const requestData = new FormData();
  requestData.append("connectionName", connName);
  requestData.append("connectionLocation", connLocation);
  requestData.append("accessToken", accessToken);

  const request = new Request("http://localhost:8080/addSelfHostedConnection", {
    method: "POST",
    body: requestData,
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  return resp;
}
