import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { FreshContext } from "$fresh/server.ts";
import { SESSION_ID, cleanup, createFreshCtx } from "../utils/test/testUtils.ts";
import { handler } from "./accessToken.tsx";
import { _internals } from "./accessToken.tsx";
import { localKv } from "../utils/kv/db.ts";
import { DEPLOY_USER_KEY_PREFIX } from "../consts.ts";
import { DeployUser } from "../utils/user/denoDeploy/deployUser.ts";
import { userNames } from "../utils/state/state.ts";
import { ENCRYPTED_USER_ACCESS_TOKEN_PREFIX } from "../consts.ts";

Deno.test("accessToken - short access token errors out", async () => {
  try {
    const resp = await callAPI("short");
    const html = await resp.text();
    assertEquals(resp.status, 200);
    assert(/<h2 class=".*">Invalid access token.<\/h2>/.test(html));
  } finally {
    await cleanup();
  }
});

Deno.test("accessToken - no user found", async () => {
  _internals.buildRemoteData = async (_accessToken: string, _session: string) => {
    throw new Error("User not found");
  };

  try {
    const resp = await callAPI("ddp_aB8mrKEfu6s9ZJX23Hv6WQt5dtl4PmF1YSYTb");
    const html = await resp.text();
    assertEquals(resp.status, 200);
    assert(/<h2 class=".*">Invalid access token.<\/h2>/.test(html));
  } finally {
    await cleanup();
  }
});

Deno.test("accessToken - happy path", async () => {
  _internals.buildRemoteData = mockBuildRemoteData;

  try {
    const resp = await callAPI("ddp_aB8mrKEfu6s9ZJX23Hv6WQt5dtl4PmF1YSYTb");
    assertEquals(resp.status, 303);
    assertEquals(resp.headers.get("Location"), "/");

    const deployUserEntry = await localKv.get<DeployUser>([DEPLOY_USER_KEY_PREFIX, SESSION_ID]);
    assert(deployUserEntry.value);
    assertEquals(deployUserEntry.value.id, "user id");
    assertEquals(userNames.get(SESSION_ID), "user id");
    assert(await localKv.get([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, SESSION_ID]));
  } finally {
    await localKv.delete([DEPLOY_USER_KEY_PREFIX, SESSION_ID]);
    await localKv.delete([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, SESSION_ID]);
    await cleanup();
  }
});

async function callAPI(accessToken: string) {
  assert(handler.POST);

  const requestData = new FormData();
  requestData.append("accessToken", accessToken);

  const request = new Request("http://localhost:8080/accessToken", {
    method: "POST",
    body: requestData,
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  return resp;
}

async function mockBuildRemoteData(accessToken: string, session: string) {
  return {
    id: "user id",
    login: "user login",
    name: "user name",
    avatarUrl: "http://example.com/avatar.png",
    organisations: [],
  };
}
