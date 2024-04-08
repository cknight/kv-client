import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { DeleteAuditLog, ListResults, State } from "../../types.ts";
import { localKv } from "../../utils/kv/db.ts";
import { abort, getUserState } from "../../utils/state/state.ts";
import { DB_ID } from "../../utils/test/testUtils.ts";
import { cleanup, createDb, createFreshCtx, SESSION_ID } from "../../utils/test/testUtils.ts";
import { hashKvKey } from "../../utils/utils.ts";
import { DeleteKeysData, handler } from "./deleteKeys.tsx";

const SOURCE = "test_source.db";
const KEY_TO_DELETE_1 = "key_to_delete1";
const KEY_TO_DELETE_2 = "key_to_delete2";
const KEY_TO_DELETE_3 = "key_to_delete3";
const KEY_TO_KEEP = "key_to_keep";

Deno.test("Delete keys - happy path deleting selected keys", async () => {
  const kv = await createDb();

  try {
    const state = getUserState(SESSION_ID);
    await kv.set([KEY_TO_DELETE_1], "value_to_copy");
    await kv.set([KEY_TO_DELETE_2], "value_to_copy");
    await kv.set([KEY_TO_KEEP], "value_to_copy");
    const entryToCache1 = await kv.get([KEY_TO_DELETE_1]);
    const entryToCache2 = await kv.get([KEY_TO_DELETE_2]);
    const entryToCache3 = await kv.get([KEY_TO_KEEP]);
    const listResults: ListResults = {
      connectionId: DB_ID,
      prefix: "",
      start: "",
      end: "",
      reverse: false,
      results: [
        entryToCache1 as Deno.KvEntry<string>,
        entryToCache2 as Deno.KvEntry<string>,
        entryToCache3 as Deno.KvEntry<string>,
      ],
      cursor: false,
    };
    state.cache.add(listResults, SESSION_ID);

    const requestData: DeleteKeysData = {
      connectionId: DB_ID,
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
    await cleanup(kv);
  }
});

Deno.test("Delete keys - happy path deleting filtered results", async () => {
  const kv = await createDb();

  try {
    const state = getUserState(SESSION_ID);
    await kv.set([KEY_TO_DELETE_1], "value_to_copy");
    await kv.set([KEY_TO_DELETE_2], "value_to_copy");
    await kv.set([KEY_TO_KEEP], "value_to_copy");
    const entryToCache1 = await kv.get([KEY_TO_DELETE_1]);
    const entryToCache2 = await kv.get([KEY_TO_DELETE_2]);
    const entryToCache3 = await kv.get([KEY_TO_KEEP]);
    const listResults: ListResults = {
      connectionId: DB_ID,
      prefix: "",
      start: "",
      end: "",
      reverse: false,
      results: [
        entryToCache1 as Deno.KvEntry<string>,
        entryToCache2 as Deno.KvEntry<string>,
        entryToCache3 as Deno.KvEntry<string>,
      ],
      cursor: false,
    };
    state.cache.add(listResults, SESSION_ID);

    const requestData: DeleteKeysData = {
      connectionId: DB_ID,
      keysToDelete: [],
      filter: "delete", //will match key_to_delete1 and key_to_delete2
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
    await cleanup(kv);
  }
});

Deno.test("Delete keys - happy path deleting all results", async () => {
  const kv = await createDb();

  try {
    const state = getUserState(SESSION_ID);
    await kv.set([KEY_TO_DELETE_1], "value_to_copy");
    await kv.set([KEY_TO_DELETE_2], "value_to_copy");
    await kv.set([KEY_TO_DELETE_3], "value_to_copy");
    const entryToCache1 = await kv.get([KEY_TO_DELETE_1]);
    const entryToCache2 = await kv.get([KEY_TO_DELETE_2]);
    const entryToCache3 = await kv.get([KEY_TO_DELETE_3]);
    const listResults: ListResults = {
      connectionId: DB_ID,
      prefix: "",
      start: "",
      end: "",
      reverse: false,
      results: [
        entryToCache1 as Deno.KvEntry<string>,
        entryToCache2 as Deno.KvEntry<string>,
        entryToCache3 as Deno.KvEntry<string>,
      ],
      cursor: false,
    };
    state.cache.add(listResults, SESSION_ID);

    const requestData: DeleteKeysData = {
      connectionId: DB_ID,
      keysToDelete: [],
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
    assertEquals(await resp.text(), "3 KV entries successfully deleted");

    //validate key 1 deleted
    const entry = await kv.get([KEY_TO_DELETE_1]);
    assertEquals(entry.value, null);
    assertEquals(entry.versionstamp, null);

    //validate key 2 deleted
    const entry2 = await kv.get([KEY_TO_DELETE_2]);
    assertEquals(entry2.value, null);
    assertEquals(entry2.versionstamp, null);

    //validate key 3 is deleted
    const entry3 = await kv.get([KEY_TO_DELETE_3]);
    assertEquals(entry3.value, null);
    assertEquals(entry3.versionstamp, null);

    await assertAuditRecord(3);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("Delete keys - abort delete", async () => {
  const kv = await createDb();

  try {
    const state = getUserState(SESSION_ID);
    await kv.set([KEY_TO_DELETE_1], "value_to_copy");
    const entryToCache1 = await kv.get([KEY_TO_DELETE_1]);
    const listResults: ListResults = {
      connectionId: DB_ID,
      prefix: "",
      start: "",
      end: "",
      reverse: false,
      results: [entryToCache1 as Deno.KvEntry<string>],
      cursor: false,
    };
    state.cache.add(listResults, SESSION_ID);

    const requestData: DeleteKeysData = {
      connectionId: DB_ID,
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
    await cleanup(kv);
  }
});

async function callAPI(requestData: DeleteKeysData, state: State) {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/deleteKeys", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
  const ctx = createFreshCtx(request);
  state.connection = {
    kvLocation: SOURCE,
    environment: "local",
    name: "test-" + DB_ID,
    id: DB_ID,
    infra: "local",
    size: 0,
  };
  const resp = await handler.POST(request, ctx);
  return resp;
}

async function assertAuditRecord(keysDeleted = 2) {
  const auditRecordEntry = await Array.fromAsync(
    localKv.list<DeleteAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.auditType, "delete");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.connection, "test-" + DB_ID + " (local), " + DB_ID);
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.rtms >= 0, true);
  assertEquals(auditRecord.keysDeleted, keysDeleted);
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
  assertEquals(auditRecord.connection, "test-" + DB_ID + " (local), " + DB_ID);
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.rtms >= 0, true);
  assertEquals(auditRecord.keysDeleted, 0);
  assertEquals(auditRecord.keysFailed, 0);
  assertEquals(auditRecord.aborted, true);
  assertEquals(auditRecord.writeUnitsConsumed, 0);
}
