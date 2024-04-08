import { assertEquals } from "$std/assert/assert_equals.ts";
import { assertRejects } from "$std/assert/assert_rejects.ts";
import { join } from "$std/path/join.ts";
import { CONNECTIONS_KEY_PREFIX, env } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { getUserState } from "../state/state.ts";
import { addTestConnection, createDb, DB_ID, DB_PATH, SESSION_ID } from "../test/testUtils.ts";
import { logout } from "../user/logout.ts";
import { localKv } from "./db.ts";
import { openKvWithToken } from "./kvConnect.ts";
import { connectToSecondaryKv, establishKvConnection } from "./kvConnect.ts";

Deno.test("establishKvConnection - no user state throws", () => {
  assertRejects(
    async () => await establishKvConnection("session", "connectionId"),
    "Invalid session",
  );
});

Deno.test("establishKvConnection - already connected to requested connection", async () => {
  const state = getUserState(SESSION_ID);
  try {
    state.kv = localKv;
    state.connection = {
      id: "connectionId",
      name: "connectionName",
      kvLocation: "kvLocation",
      environment: "local",
      infra: "local",
      size: 0,
    };
    const kv = await establishKvConnection(SESSION_ID, "connectionId");
    assertEquals(kv, localKv);
  } finally {
    state.kv = null; //localKV opened before test so don't let it be closed
    await logout(SESSION_ID);
  }
});

Deno.test("establishKvConnection - connect to different local connection", async () => {
  const state = getUserState(SESSION_ID);
  const { oldConnection } = await addSourceAndDestDbs();
  let establishedKv: Deno.Kv | undefined;
  try {
    state.kv = oldConnection;
    const kvConnection: KvConnection = {
      id: "123",
      name: "oldConnection",
      kvLocation: "kvLocation",
      environment: "local",
      infra: "local",
      size: 0,
    };
    state.connection = kvConnection;
    establishedKv = await establishKvConnection(SESSION_ID, "456");
    const entry = await establishedKv.get(["testKey"]);
    assertEquals(entry.value, "testValue");
    assertEquals(state.kv, establishedKv);
    assertEquals(state.connection.id, "456");
  } finally {
    await cleanup();
  }
});

Deno.test("Connect to secondary KV - valid connection", async () => {
  const kv = await createDb();
  await kv.set(["testKey"], "testValue");
  kv.close();

  let secondaryKv: Deno.Kv | undefined;
  try {
    secondaryKv = await connectToSecondaryKv(SESSION_ID, DB_ID);
    const entry = await secondaryKv.get(["testKey"]);
    assertEquals(entry.value, "testValue");
  } finally {
    secondaryKv?.close();
    await cleanup();
  }
});

Deno.test("Connect to secondary KV - invalid connection", () => {
  assertRejects(
    async () => await connectToSecondaryKv(SESSION_ID, "invalidId"),
    'Connection "madeUpConn" does not exist',
  );
});

Deno.test("Connect to secondary KV - local connection does not exist", async () => {
  try {
    await addTestConnection("non-existant location", "123");
    assertRejects(
      async () => await connectToSecondaryKv(SESSION_ID, "123"),
      'Connection "123" does not exist',
    );
  } finally {
    await localKv.delete([CONNECTIONS_KEY_PREFIX, "123"]);
  }
});

Deno.test("Open with token - valid token", async () => {
  const kv = await createDb();
  await kv.set(["testKey"], "testValue");
  kv.close();

  let newConnection: Deno.Kv | undefined;
  try {
    assertEquals(Deno.env.get(env.DENO_KV_ACCESS_TOKEN), undefined);
    newConnection = await openKvWithToken(DB_PATH, "my token");
    assertEquals(Deno.env.get(env.DENO_KV_ACCESS_TOKEN), undefined);
    const entry = await newConnection.get(["testKey"]);
    assertEquals(entry.value, "testValue");
  } finally {
    Deno.env.delete(env.DENO_KV_ACCESS_TOKEN);
    newConnection?.close();
    await cleanup();
  }
});

Deno.test("Open with token - no token supplied", () => {
  assertRejects(
    async () => await openKvWithToken(DB_PATH, null),
    "No access token available",
  );
});

async function cleanup() {
  //old KV is closed when establishing new connection, new KV is closed in logout below
  await localKv.delete([CONNECTIONS_KEY_PREFIX, "123"]);
  await localKv.delete([CONNECTIONS_KEY_PREFIX, "456"]);
  await localKv.delete([CONNECTIONS_KEY_PREFIX, DB_ID]);
  await Deno.remove(join(Deno.cwd(), "testDb"), { recursive: true });
  await logout(SESSION_ID);
}

async function addSourceAndDestDbs(): Promise<{ oldConnection: Deno.Kv }> {
  await Deno.mkdir("testDb");
  const sourceDbPath = join(Deno.cwd(), "testDb", "test_source.db");
  const destDbPath = join(Deno.cwd(), "testDb", "test_dest.db");
  await addTestConnection(sourceDbPath, "123");
  await addTestConnection(destDbPath, "456");
  const oldConnection = await Deno.openKv(sourceDbPath);
  const newConnection = await Deno.openKv(destDbPath);
  try {
    await newConnection.set(["testKey"], "testValue");
  } finally {
    newConnection.close();
  }
  return { oldConnection };
}
