import { assert } from "@std/assert";
import { assertEquals } from "@std/assert/assert-equals";
import { createFreshCtx, SESSION_ID } from "../utils/test/testUtils.ts";
import { _internals, handler } from "./logout.tsx";

Deno.test("Logout - happy path", async () => {
  let logoutSessionId = "";
  // deno-lint-ignore require-await
  _internals.logout = async (sessionId: string) => {
    logoutSessionId = sessionId;
  };
  const resp = await callHandler();
  assertEquals(resp.status, 200);
  assertEquals(logoutSessionId, SESSION_ID);
  assertEquals(resp.headers.get("set-cookie"), "session=; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
});

async function callHandler() {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/logout", {
    method: "POST",
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  return resp;
}
