import { assertGreaterOrEqual } from "@std/assert";
import { assertEquals } from "@std/assert/assert-equals";
import { CONNECTIONS_KEY_PREFIX, DEPLOY_USER_KEY_PREFIX } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { localKv } from "../kv/db.ts";
import { cleanup, createDb, DB_ID, DB_PATH, SESSION_ID } from "../test/testUtils.ts";
import {
  getConnections,
  getKvConnectionDetails,
  getLocalConnections,
  getSelfHostedConnections,
} from "./connections.ts";
import { assert } from "@std/assert";
import { fail } from "@std/assert";

Deno.test("getConnections", async () => {
  const deployUser = JSON.parse(await Deno.readTextFile("./testData/expected_deploy_user.json"));

  //add local db and connection
  const kv = await createDb();
  try {
    await localKv.set([DEPLOY_USER_KEY_PREFIX, SESSION_ID], deployUser);

    //add self-hosted
    await localKv.set([CONNECTIONS_KEY_PREFIX, "456"], {
      id: "456",
      name: "test2",
      infra: "self-hosted",
      kvLocation: "https://my-site.com/db",
      environment: "self-hosted",
      size: 100,
    } as KvConnection);

    const connections = await getConnections(SESSION_ID);
    assertGreaterOrEqual(connections.remote.length, 1);
    assertGreaterOrEqual(connections.local.length, 1);
    assertGreaterOrEqual(connections.selfHosted.length, 1);

    let found = false;
    for (const conn of connections.local) {
      if (conn.id === DB_ID) {
        found = true;
        assertEquals(conn.name, "test-" + DB_ID);
        assertEquals(conn.infra, "local");
        assertEquals(conn.kvLocation, DB_PATH);
        assertEquals(conn.environment, "local");
        assertGreaterOrEqual(conn.size, 3000);
      }
    }
    assert(found);

    found = false;
    for (const conn of connections.selfHosted) {
      if (conn.id === "456") {
        found = true;
        assertEquals(conn.name, "test2");
        assertEquals(conn.infra, "self-hosted");
        assertEquals(conn.kvLocation, "https://my-site.com/db");
        assertEquals(conn.environment, "self-hosted");
        assertEquals(conn.size, 100);
      }
    }
    assert(found);

    found = false;
    for (const conn of connections.remote) {
      if (conn.id === "cc9a9caf-602a-4904-a1a0-1238a456331d") {
        found = true;
        assertEquals(conn.name, "high-chicken-79");
        assertEquals(conn.infra, "Deploy");
        assertEquals(
          conn.kvLocation,
          "https://api.deno.com/databases/cc9a9caf-602a-4904-a1a0-1238a456331d/connect",
        );
        assertEquals(conn.environment, "Deploy playground");
        assertEquals(conn.size, 232750);
      }
    }
    assert(found);
  } finally {
    await localKv.delete([DEPLOY_USER_KEY_PREFIX, SESSION_ID]);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, "123"]);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, "456"]);
    await cleanup(kv);
  }
});

Deno.test("getConnections - local connections", async () => {
  //add local db and connection
  const kv = await createDb();

  //add non-existent local connection
  await localKv.set([CONNECTIONS_KEY_PREFIX, "456"], {
    id: "456",
    name: "test2",
    infra: "local",
    kvLocation: "/Users/joebloggs/db.sqlite",
    environment: "local",
    size: 100,
  } as KvConnection);

  try {
    const localConnections = await getLocalConnections(SESSION_ID);
    assertGreaterOrEqual(localConnections.length, 1);
    let found = false;
    for (const conn of localConnections) {
      if (conn.id === DB_ID) {
        found = true;
        assertEquals(conn.name, "test-" + DB_ID);
        assertEquals(conn.infra, "local");
        assertEquals(conn.kvLocation, DB_PATH);
        assertEquals(conn.environment, "local");
        assertGreaterOrEqual(conn.size, 3000);
      }
    }
    assert(found);

    for (const conn of localConnections) {
      if (conn.id === "456") {
        fail("Should not have found non-existent local connection");
      }
    }
  } finally {
    await cleanup(kv);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, "456"]);
  }
});

Deno.test("getSelfHostedConnections", async () => {
  //add self-hosted
  await localKv.set([CONNECTIONS_KEY_PREFIX, "456"], {
    id: "456",
    name: "test2",
    infra: "self-hosted",
    kvLocation: "https://my-site.com/db",
    environment: "self-hosted",
    size: 100,
  } as KvConnection);

  try {
    const selfHostedConnections = await getSelfHostedConnections(SESSION_ID);
    assertGreaterOrEqual(selfHostedConnections.length, 1);
    let found = false;
    for (const conn of selfHostedConnections) {
      if (conn.id === "456") {
        found = true;
        assertEquals(conn.name, "test2");
        assertEquals(conn.infra, "self-hosted");
        assertEquals(conn.kvLocation, "https://my-site.com/db");
        assertEquals(conn.environment, "self-hosted");
        assertEquals(conn.size, 100);
      }
    }
    assert(found);
  } finally {
    await localKv.delete([CONNECTIONS_KEY_PREFIX, "456"]);
  }
});

Deno.test("getKvConnectionDetails", async () => {
  //add local db and connection
  const kv = await createDb();
  try {
    const conn = await getKvConnectionDetails(DB_ID);
    assert(conn);
    assertEquals(conn.id, DB_ID);
    assertEquals(conn.name, "test-" + DB_ID);
    assertEquals(conn.infra, "local");
    assertEquals(conn.kvLocation, DB_PATH);
    assertEquals(conn.environment, "local");
    assertEquals(conn.size, 0);
  } finally {
    await cleanup(kv);
  }
});
