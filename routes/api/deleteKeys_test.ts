import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { join } from "$std/path/join.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { DeleteAuditLog, ListResults, State } from "../../types.ts";
import { logout } from "../../utils/connections/denoDeploy/logout.ts";
import { localKv } from "../../utils/kv/db.ts";
import { abort, getUserState } from "../../utils/state/state.ts";
import { SESSION_ID, addTestConnection, createFreshCtx } from "../../utils/test/testUtils.ts";
import { hashKvKey } from "../../utils/utils.ts";
import { DeleteKeysData, handler } from "./deleteKeys.tsx";

const SOURCE = "test_source.db";
const KEY_TO_DELETE_1 = "key_to_delete1";
const KEY_TO_DELETE_2 = "key_to_delete2";
const KEY_TO_KEEP = "key_to_keep";

Deno.test("Delete keys - happy path", async () => {
  const kv = await createDb();

  try {
    const state = getUserState(SESSION_ID);
    await kv.set([KEY_TO_DELETE_1], "value_to_copy");
    await kv.set([KEY_TO_DELETE_2], "value_to_copy");
    await kv.set([KEY_TO_KEEP], "value_to_copy");
    const entryToCache1 = await kv.get([KEY_TO_DELETE_1]);
    const entryToCache2 = await kv.get([KEY_TO_DELETE_2]);
    const listResults: ListResults = {
      connectionId: "123",
      prefix: "",
      start: "",
      end: "",
      reverse: false,
      results: [entryToCache1 as Deno.KvEntry<string>, entryToCache2 as Deno.KvEntry<string>],
      cursor: false,
    };
    state.cache.add(listResults, SESSION_ID);

    const requestData: DeleteKeysData = {
      connectionId: "123",
      keysToDelete: [await hashKvKey([KEY_TO_DELETE_1]), await hashKvKey([KEY_TO_DELETE_2])],
      filter: "",
      prefix: "",
      start: "",
      end: "",
      from: 1,
      show: 10,
      reverse: false,
      abortId: "",
    };

    const resp = await callAPI(requestData, state);
    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), "2 KV entries successfully deleted");

    //validate key 1 deleted
    const entry = await kv.get([KEY_TO_DELETE_1]);
    assertEquals(entry.value, null);
    assertEquals(entry.versionstamp, null);

    //validate key 2 deleted
    const entry2 = await kv.get([KEY_TO_DELETE_2]);
    assertEquals(entry2.value, null);
    assertEquals(entry2.versionstamp, null);
    
    //validate key 3 is kept
    const entry3 = await kv.get([KEY_TO_KEEP]);
    assertEquals(entry3.value, "value_to_copy");
    assert(entry3.versionstamp);

    await assertAuditRecord();
  } finally {
    kv.close();
    await localKv.delete([CONNECTIONS_KEY_PREFIX, SOURCE]);
    await Deno.remove(join(Deno.cwd(), "testDb"), { recursive: true });
    await logout(SESSION_ID);
  }
});

Deno.test("Delete keys - abort delete", async () => {
  const kv = await createDb();

  try {
    const state = getUserState(SESSION_ID);
    await kv.set([KEY_TO_DELETE_1], "value_to_copy");
    const entryToCache1 = await kv.get([KEY_TO_DELETE_1]);
    const listResults: ListResults = {
      connectionId: "123",
      prefix: "",
      start: "",
      end: "",
      reverse: false,
      results: [entryToCache1 as Deno.KvEntry<string>],
      cursor: false,
    };
    state.cache.add(listResults, SESSION_ID);

    const requestData: DeleteKeysData = {
      connectionId: "123",
      keysToDelete: [await hashKvKey([KEY_TO_DELETE_1])],
      filter: "",
      prefix: "",
      start: "",
      end: "",
      from: 1,
      show: 10,
      reverse: false,
      abortId: "abort-1234",
    };

    await abort("abort-1234");
    const resp = await callAPI(requestData, state);
    assertEquals(resp.status, 499);
    assertEquals(await resp.text(), "Delete aborted at 0% complete. 0 key deleted");

    //validate key 1 not deleted
    const entry = await kv.get([KEY_TO_DELETE_1]);
    assertEquals(entry.value, "value_to_copy");
    assert(entry.versionstamp);

    await assertAbortedAuditRecord();
  } finally {
    kv.close();
    await localKv.delete([CONNECTIONS_KEY_PREFIX, SOURCE]);
    await Deno.remove(join(Deno.cwd(), "testDb"), { recursive: true });
    await logout(SESSION_ID);
  }
});

async function callAPI(requestData: DeleteKeysData, state: State) {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/export/deleteKeys", {
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
    localKv.list<DeleteAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.auditType, "delete");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.connection, "test-123 (local), 123");
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.rtms > 0, true);
  assertEquals(auditRecord.keysDeleted, 2);
  assertEquals(auditRecord.keysFailed, 0);
  assertEquals(auditRecord.aborted, false);
  assertEquals(auditRecord.writeUnitsConsumed, 1);
}

async function assertAbortedAuditRecord() {
  const auditRecordEntry = await Array.fromAsync(
    localKv.list<DeleteAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.auditType, "delete");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.connection, "test-123 (local), 123");
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.rtms > 0, true);
  assertEquals(auditRecord.keysDeleted, 0);
  assertEquals(auditRecord.keysFailed, 0);
  assertEquals(auditRecord.aborted, true);
  assertEquals(auditRecord.writeUnitsConsumed, 0);
}

async function createDb(): Promise<Deno.Kv> {
  await Deno.mkdir("testDb");
  const sourceDbPath = join(Deno.cwd(), "testDb", "test_source.db");
  await addTestConnection(sourceDbPath, "123");
  const sourceKv = await Deno.openKv(sourceDbPath);
  return sourceKv;
}
