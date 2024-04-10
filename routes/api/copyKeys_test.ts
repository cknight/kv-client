import { assert } from "@std/assert";
import { assertEquals } from "@std/assert/assert-equals";
import { join } from "@std/path";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { CopyAuditLog, ListResults, State } from "../../types.ts";
import { logout } from "../../utils/user/logout.ts";
import { localKv } from "../../utils/kv/db.ts";
import { abort, getUserState } from "../../utils/state/state.ts";
import { addTestConnection } from "../../utils/test/testUtils.ts";
import { createFreshCtx, SESSION_ID } from "../../utils/test/testUtils.ts";
import { hashKvKey } from "../../utils/utils.ts";
import { CopyKeysData, handler } from "./copyKeys.tsx";

const TEST_DB_PATH = "testDb" + crypto.randomUUID();
const SOURCE = "test_source.db";
const DEST = "test_dest.db";
const KEY_TO_COPY = "key_to_copy";

Deno.test("Copy Keys - happy path", async () => {
  const { sourceKv, destKv } = await addSourceAndDestDbs();

  try {
    const state = getUserState(SESSION_ID);
    await sourceKv.set([KEY_TO_COPY], "value_to_copy");
    const entryToCache = await sourceKv.get([KEY_TO_COPY]);
    const listResults: ListResults = {
      connectionId: "123",
      prefix: "",
      start: "",
      end: "",
      reverse: false,
      results: [entryToCache as Deno.KvEntry<string>],
      cursor: false,
    };
    state.cache.add(listResults, SESSION_ID);

    const requestData: CopyKeysData = {
      sourceConnectionId: "123",
      destConnectionId: "456",
      keysToCopy: [await hashKvKey([KEY_TO_COPY])],
      filter: "",
      prefix: "",
      start: "",
      end: "",
      from: 0,
      show: 10,
      reverse: false,
      abortId: "",
    };

    const resp = await callAPI(requestData, state);
    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), "KV entry successfully copied");

    //validate key copied
    const entry = await destKv.get([KEY_TO_COPY]);
    assertEquals(entry.value, "value_to_copy");

    await assertAuditRecord();
  } finally {
    sourceKv.close();
    destKv.close();
    await localKv.delete([CONNECTIONS_KEY_PREFIX, SOURCE]);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, DEST]);

    await Deno.remove(join(Deno.cwd(), TEST_DB_PATH), { recursive: true });
    await logout(SESSION_ID);
  }
});

Deno.test("Copy Keys - keys mismatch causes failure", async () => {
  const { sourceKv, destKv } = await addSourceAndDestDbs();

  try {
    const state = getUserState(SESSION_ID);
    await sourceKv.set([KEY_TO_COPY], "value_to_copy");
    const entryToCache = await sourceKv.get([KEY_TO_COPY]);
    const listResults: ListResults = {
      connectionId: "123",
      prefix: "",
      start: "",
      end: "",
      reverse: false,
      results: [entryToCache as Deno.KvEntry<string>],
      cursor: false,
    };
    state.cache.add(listResults, SESSION_ID);

    const requestData: CopyKeysData = {
      sourceConnectionId: "123",
      destConnectionId: "456",
      keysToCopy: [(await hashKvKey([KEY_TO_COPY])) + "zzz"], //break hash
      filter: "",
      prefix: "",
      start: "",
      end: "",
      from: 0,
      show: 10,
      reverse: false,
      abortId: "",
    };

    const resp = await callAPI(requestData, state);
    assertEquals(resp.status, 500);
    assertEquals(await resp.text(), "Failed to copy keys");

    //validate key not copied
    const allEntries = await Array.fromAsync(destKv.list({ prefix: [] }));
    assertEquals(allEntries.length, 0);
  } finally {
    await cleanup(sourceKv, destKv);
  }
});

Deno.test("Copy Keys - operation aborted", async () => {
  const { sourceKv, destKv } = await addSourceAndDestDbs();

  try {
    const state = getUserState(SESSION_ID);
    await sourceKv.set([KEY_TO_COPY], "value_to_copy");
    const entryToCache = await sourceKv.get([KEY_TO_COPY]);
    const listResults: ListResults = {
      connectionId: "123",
      prefix: "",
      start: "",
      end: "",
      reverse: false,
      results: [entryToCache as Deno.KvEntry<string>],
      cursor: false,
    };
    state.cache.add(listResults, SESSION_ID);

    const requestData: CopyKeysData = {
      sourceConnectionId: "123",
      destConnectionId: "456",
      keysToCopy: [await hashKvKey([KEY_TO_COPY])],
      filter: "",
      prefix: "",
      start: "",
      end: "",
      from: 0,
      show: 10,
      reverse: false,
      abortId: "abort-1234",
    };
    await abort("abort-1234");
    const resp = await callAPI(requestData, state);
    assertEquals(resp.status, 499);
    assertEquals(await resp.text(), "Copy aborted at 0% complete. 0 key copied");

    //validate key not copied
    const allEntries = await Array.fromAsync(destKv.list({ prefix: [] }));
    assertEquals(allEntries.length, 0);
  } finally {
    await cleanup(sourceKv, destKv);
  }
});

async function cleanup(sourceKv: Deno.Kv, destKv: Deno.Kv) {
  sourceKv.close();
  destKv.close();
  await localKv.delete([CONNECTIONS_KEY_PREFIX, SOURCE]);
  await localKv.delete([CONNECTIONS_KEY_PREFIX, DEST]);
  await localKv.delete([CONNECTIONS_KEY_PREFIX, "123"]);
  await localKv.delete([CONNECTIONS_KEY_PREFIX, "456"]);

  await logout(SESSION_ID);
  await Deno.remove(join(Deno.cwd(), TEST_DB_PATH), { recursive: true });
}

async function callAPI(requestData: CopyKeysData, state: State) {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/export/copyKeys", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
  const ctx = createFreshCtx(request);
  state.connection = {
    kvLocation: SOURCE,
    environment: "local",
    name: "test-123",
    id: "123",
    infra: "local",
    size: 0,
  };
  const resp = await handler.POST(request, ctx);
  return resp;
}

async function assertAuditRecord() {
  const auditRecordEntry = await Array.fromAsync(
    localKv.list<CopyAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.auditType, "copy");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.connection, "test-123 (local), 123");
  assertEquals(auditRecord.destinationConnection, "test-456 (local), 456");
  assertEquals(auditRecord.destinationInfra, "local");
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.rtms >= 0, true);
  assertEquals(auditRecord.keysCopied, 1);
  assertEquals(auditRecord.keysFailed, 0);
  assertEquals(auditRecord.aborted, false);
  assertEquals(auditRecord.writeUnitsConsumed, 1);
}

async function addSourceAndDestDbs(): Promise<{ sourceKv: Deno.Kv; destKv: Deno.Kv }> {
  await Deno.mkdir(TEST_DB_PATH);
  const sourceDbPath = join(Deno.cwd(), TEST_DB_PATH, "test_source.db");
  const destDbPath = join(Deno.cwd(), TEST_DB_PATH, "test_dest.db");
  await addTestConnection(sourceDbPath, "123");
  await addTestConnection(destDbPath, "456");
  const sourceKv = await Deno.openKv(sourceDbPath);
  const destKv = await Deno.openKv(destDbPath);
  return { sourceKv, destKv };
}
