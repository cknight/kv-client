import { assertEquals } from "$std/assert/assert_equals.ts";
import { assert } from "$std/assert/assert.ts";
import { KvConnection, ListResults, State, UpdateAuditLog } from "../../types.ts";
import { getUserState } from "../../utils/state/state.ts";
import { cleanup, createDb, createFreshCtx, SESSION_ID } from "../../utils/test/testUtils.ts";
import { hashKvKey } from "../../utils/utils.ts";
import { handler, UpdateKeyData } from "./updateKey.tsx";
import { localKv } from "../../utils/kv/db.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { json5Stringify } from "../../utils/transform/stringSerialization.ts";

Deno.test("Update Key - happy path", async () => {
  const kv = await createDb();
  try {
    await kv.set(["key_to_update"], "old_value");
    const preEntry = await kv.get<string>(["key_to_update"]);
    assertEquals(preEntry.value, "old_value");

    const state = getUserState(SESSION_ID);
    addDataToCache(state, preEntry);

    const requestData: UpdateKeyData = {
      connectionId: "123",
      keyHash: await hashKvKey(preEntry.key),
      value: json5Stringify("new_value", true),
      prefix: "",
      start: "",
      end: "",
      from: 1,
      show: 10,
      reverse: false,
    };

    const resp = await callAPI(requestData, state);
    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), "Update successful");

    const postEntry = await kv.get<string>(["key_to_update"]);
    assertEquals(postEntry.value, "new_value");
    assert(postEntry.versionstamp);

    await assertAuditRecord();
  } finally {
    await cleanup(kv);
  }
});

Deno.test("Update Key - no cached data", async () => {
  const kv = await createDb();
  try {
    await kv.set(["key_to_update"], "old_value");
    const preEntry = await kv.get<string>(["key_to_update"]);
    assertEquals(preEntry.value, "old_value");

    const state = getUserState(SESSION_ID);
    // Deliberately don't add the data to the cache

    const requestData: UpdateKeyData = {
      connectionId: "123",
      keyHash: await hashKvKey(preEntry.key),
      value: json5Stringify("new_value", true),
      prefix: "",
      start: "",
      end: "",
      from: 1,
      show: 10,
      reverse: false,
    };

    const resp = await callAPI(requestData, state);
    assertEquals(resp.status, 500);
    assertEquals(
      await resp.text(),
      "Cache data not found.  This can happen if the data has been changed through this UI.  Please reload the data and try again.",
    );

    const postEntry = await kv.get<string>(["key_to_update"]);
    assertEquals(postEntry.value, "old_value");
    assert(postEntry.versionstamp);
  } finally {
    await cleanup(kv);
  }
});

function addDataToCache(state: State, entry: Deno.KvEntryMaybe<string>) {
  const listResults: ListResults = {
    connectionId: "123",
    prefix: "",
    start: "",
    end: "",
    reverse: false,
    results: [entry as Deno.KvEntry<string>],
    cursor: false,
  };
  state.cache.add(listResults, SESSION_ID);
}

async function callAPI(requestData: UpdateKeyData, state: State) {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/updateKey", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
  const ctx = createFreshCtx(request);
  const connDetails = await localKv.get<KvConnection>([CONNECTIONS_KEY_PREFIX, "123"]);
  state.connection = {
    kvLocation: connDetails.value!.kvLocation,
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
    localKv.list<UpdateAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.auditType, "update");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.connection, "test-123 (local), 123");
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.rtms >= 0, true);
  assertEquals(auditRecord.updateSuccessful, true);
  assertEquals(auditRecord.key, json5Stringify(["key_to_update"], true));
  assertEquals(auditRecord.originalValue, json5Stringify("old_value", true));
  assertEquals(auditRecord.newValue, json5Stringify("new_value"));
  assertEquals(auditRecord.writeUnitsConsumed, 1);
  assert(auditRecord.newVersionstamp);
}
