import { assertEquals } from "@std/assert/assert-equals";
import { DEPLOY_USER_KEY_PREFIX, ENCRYPTED_USER_ACCESS_TOKEN_PREFIX } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { localKv } from "../kv/db.ts";
import { getUserState, userNames } from "../state/state.ts";
import { cleanup } from "../test/testUtils.ts";
import { createDb, SESSION_ID } from "../test/testUtils.ts";
import { logout } from "./logout.ts";

Deno.test("Logout", async () => {
  const kv = await createDb();
  try {
    const beforeState = getUserState(SESSION_ID);
    beforeState.kv = kv;
    beforeState.connection = {
      id: SESSION_ID,
      kvLocation: "local",
      environment: "local",
      name: "test-" + SESSION_ID,
    } as KvConnection;
    beforeState.cache.add({
      connectionId: "123",
      prefix: "",
      start: "",
      end: "",
      reverse: false,
      results: [],
      cursor: false,
    }, SESSION_ID);
    userNames.set(SESSION_ID, "joe");

    await localKv.set([DEPLOY_USER_KEY_PREFIX, SESSION_ID], "hello world");
    await localKv.set([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, SESSION_ID], "hello world");

    await logout(SESSION_ID);

    assertEquals((await localKv.get([DEPLOY_USER_KEY_PREFIX, SESSION_ID])).value, null);
    assertEquals((await localKv.get([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, SESSION_ID])).value, null);
    const afterState = getUserState(SESSION_ID);
    assertEquals(afterState.kv, null);
    assertEquals(afterState.connection, null);
    assertEquals(afterState.cache.size(), 0);
    assertEquals(userNames.get(SESSION_ID), undefined);
  } finally {
    await cleanup();
  }
});
