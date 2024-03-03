import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { SetAuditLog } from "../../types.ts";
import { localKv } from "../../utils/kv/db.ts";
import { getUserState } from "../../utils/state/state.ts";
import { SESSION_ID, cleanup, createDb, createFreshCtx } from "../../utils/test/testUtils.ts";
import { json5Stringify } from "../../utils/transform/stringSerialization.ts";
import { KvSetEntry, handler } from "./setEntry.tsx";

Deno.test("Set entry - happy path, OK to overwrite", async () => {
  const kv = await createDb();

  try {
    const requestData: KvSetEntry = {
      key: "\"key0\"",
      kvValue: "value0",
      valueType: "string",
      doNotOverwrite: false,
      connectionId: "123",
    };
  
    await kv.set(["key0"], "PRE VALUE");
    const preEntry = await kv.get(["key0"]);
    assertEquals(preEntry.value, "PRE VALUE");
    
    const resp = await callAPI(requestData);

    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), "Entry successfully set");
    const postEntry = await kv.get(["key0"]);
    assertEquals(postEntry.value, "value0");
    await assertAuditRecord();
    assertEquals(getUserState(SESSION_ID).cache.size(), 0);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("Set entry - happy path, do not overwrite", async () => {
  const kv = await createDb();

  try {
    const requestData: KvSetEntry = {
      key: "\"key0\"",
      kvValue: "value0",
      valueType: "string",
      doNotOverwrite: true,
      connectionId: "123",
    };
  
    const preEntry = await kv.get(["key0"]);
    assertEquals(preEntry.value, null);
    
    const resp = await callAPI(requestData);

    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), "Entry successfully set");
    const postEntry = await kv.get(["key0"]);
    assertEquals(postEntry.value, "value0");
    await assertAuditRecord();
    assertEquals(getUserState(SESSION_ID).cache.size(), 0);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("Set entry - key alread exists, do not overwrite", async () => {
  const kv = await createDb();

  try {
    const requestData: KvSetEntry = {
      key: "\"key0\"",
      kvValue: "value0",
      valueType: "string",
      doNotOverwrite: true,
      connectionId: "123",
    };
  
    await kv.set(["key0"], "PRE VALUE");
    const preEntry = await kv.get(["key0"]);
    assertEquals(preEntry.value, "PRE VALUE");
    
    const resp = await callAPI(requestData);

    assertEquals(resp.status, 500);
    assertEquals(await resp.text(), "Error setting entry: Key already exists");
  } finally {
    await cleanup(kv);
  }
});

async function callAPI(requestData: KvSetEntry) {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/setEntry", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  return resp;
}

async function assertAuditRecord() {
  const auditRecordEntry = await Array.fromAsync(
    localKv.list<SetAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.auditType, "set");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.connection, "test-123 (local), 123");
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.rtms > 0, true);
  assertEquals(auditRecord.setSuccessful, true);
  assertEquals(auditRecord.key, "\"key0\"");
  assertEquals(auditRecord.value, json5Stringify("value0", true));
  assertEquals(auditRecord.writeUnitsConsumed, 1);
  assert(auditRecord.versionstamp);
}
  