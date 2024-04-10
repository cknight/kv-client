import { assertEquals } from "@std/assert/assert-equals";
import { assert } from "@std/assert";
import { GetAuditLog } from "../../types.ts";
import { DB_ID } from "../test/testUtils.ts";
import { SESSION_ID } from "../test/testUtils.ts";
import { cleanup, createDb } from "../test/testUtils.ts";
import { localKv } from "./db.ts";
import { kvGet } from "./kvGet.ts";

Deno.test("kvGet", async () => {
  const kv = await createDb();
  try {
    await kv.set(["testKey"], "testValue");
    const options = {
      session: SESSION_ID,
      connectionId: DB_ID,
      key: `"testKey"`,
    };
    const entry = await kvGet(options);
    assertEquals(entry.value, "testValue");
    await assertAuditRecord(true);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvGet - non existent key", async () => {
  const kv = await createDb();
  try {
    const options = {
      session: SESSION_ID,
      connectionId: DB_ID,
      key: `"testKey"`, // Note: the key has not been set
    };
    const entry = await kvGet(options);
    assertEquals(entry.value, null);
    await assertAuditRecord(false);
  } finally {
    await cleanup(kv);
  }
});

async function assertAuditRecord(found: boolean) {
  const auditRecordEntry = await Array.fromAsync(
    localKv.list<GetAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.auditType, "get");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.connection, "test-" + DB_ID + " (local), " + DB_ID);
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.rtms >= 0, true);
  assertEquals(auditRecord.key, `["testKey"]`);

  if (found) {
    assert(auditRecord.resultVersionstamp !== null);
    assertEquals(auditRecord.readUnitsConsumed, 1);
  } else {
    assert(auditRecord.resultVersionstamp === null);
    assertEquals(auditRecord.readUnitsConsumed, 0);
  }
}
