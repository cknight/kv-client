import { assertEquals } from "$std/assert/assert_equals.ts";
import { assert } from "$std/assert/assert.ts";
import { createFreshCtx, SESSION_ID } from "../utils/test/testUtils.ts";
import { handler } from "./_middleware.ts";
import { DeployUser } from "../utils/user/denoDeploy/deployUser.ts";
import { localKv } from "../utils/kv/db.ts";
import { DEPLOY_USER_KEY_PREFIX } from "../consts.ts";
import { logout } from "../utils/user/logout.ts";

Deno.test("Middleware - no active session, responds with newly created session cookie", async () => {
  try {
    const request = new Request("http://localhost:8080/", {
      method: "GET",
    });
    assertEquals(request.headers.get("cookie"), null);

    const ctx = createFreshCtx(request);
    const resp = await handler(request, ctx);

    assertEquals(resp.status, 200);
    const setCookies = resp.headers.get("set-cookie");
    assert(setCookies);
    assert(/session=([^-]+-[^-]+-[^-]+-[^-]+-[^-]+) Secure; HttpOnly/.test(setCookies));
  } finally {
    await logout(SESSION_ID);
  }
});

Deno.test("Middleware - active session, responds with no new session cookie", async () => {
  try {
    const request = new Request("http://localhost:8080/", {
      method: "GET",
      headers: new Headers({
        cookie: "session=" + SESSION_ID,
      }),
    });

    const ctx = createFreshCtx(request);
    const resp = await handler(request, ctx);

    assertEquals(resp.status, 200);
    assertEquals(resp.headers.get("set-cookie"), null);
    assertEquals(ctx.state.session, SESSION_ID);
  } finally {
    await logout(SESSION_ID);
  }
});

Deno.test("Middleware - active session, deploy user, no session cookie, responds with no new session cookie", async () => {
  try {
    const deployUser: DeployUser = {
      id: "abc",
      login: "login name",
      name: "regular name",
      avatarUrl: "http://example.com/avatar.png",
      organisations: [],
    };
    await localKv.set([DEPLOY_USER_KEY_PREFIX, SESSION_ID], deployUser);
    const request = new Request("http://localhost:8080/", {
      method: "GET",
      headers: new Headers({
        cookie: "session=" + SESSION_ID,
      }),
    });

    const ctx = createFreshCtx(request);
    const resp = await handler(request, ctx);

    assertEquals(resp.status, 200);
    assertEquals(resp.headers.get("set-cookie"), null);
    assertEquals(ctx.state.session, SESSION_ID);
  } finally {
    await logout(SESSION_ID);
  }
});
