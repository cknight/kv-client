import { assertEquals } from "$std/assert/assert_equals.ts";
import { GetAuditLog, KvConnection } from "../../types.ts";
import { SESSION_ID } from "../test/testUtils.ts";
import { localKv } from "./db.ts";
import { auditAction, auditConnectionName } from "./kvAudit.ts";

type EveryAuditLog = {
  executorId: string;
};

/**
 * Running tests creates a lot of audit records.  Running the tests will trigger this one which will
 * delete any test related audits.  This is easier and faster than cleaning up after every single test.
 * However, this does mean some test-only audit records will persist between test runs.
 */
Deno.test("Clean out audits from test runs", async () => {
  const audits = await Array.fromAsync(localKv.list({ prefix: ["audit"] }));
  const testAudits = audits.filter((audit) =>
    (audit.value as EveryAuditLog).executorId === SESSION_ID
  );
  for (const audit of testAudits) {
    await localKv.delete(audit.key);
  }
});

Deno.test("Audit successful on first attempt", async () => {
  let testAudits: Deno.KvEntry<unknown>[] = [];
  try {
    await auditAction(getAudit(), SESSION_ID);

    const audits = await Array.fromAsync(localKv.list({ prefix: ["audit"] }));
    testAudits = audits.filter((audit) => (audit.value as EveryAuditLog).executorId === "test!");
    assertEquals(testAudits.length, 1);
  } finally {
    for (const audit of testAudits) {
      await localKv.delete(audit.key);
    }
  }
});

Deno.test("Audit successful on second attempt", async () => {
  let testAudits: Deno.KvEntry<unknown>[] = [];
  try {
    const getAuditRecord = getAudit();
    const now = Date.now();
    //an imprecise attempt at forcing a collision
    await localKv.atomic()
      .set(["audit", new Date(now).toISOString() + "Z"], "test!")
      .set(["audit", new Date(now + 1).toISOString() + "Z"], "test!")
      .set(["audit", new Date(now + 2).toISOString() + "Z"], "test!")
      .set(["audit", new Date(now + 3).toISOString() + "Z"], "test!")
      .set(["audit", new Date(now + 4).toISOString() + "Z"], "test!")
      .set(["audit", new Date(now + 5).toISOString() + "Z"], "test!")
      .set(["audit", new Date(now + 6).toISOString() + "Z"], "test!")
      .commit();

      await auditAction(getAuditRecord, SESSION_ID);

      const audits = await Array.fromAsync(localKv.list({ prefix: ["audit"] }));
      testAudits = audits.filter((audit) => (audit.value as EveryAuditLog).executorId === "test!");
      assertEquals(testAudits.length, 1);
    } finally {
      const audits = await Array.fromAsync(localKv.list({ prefix: ["audit"] }));
      testAudits = testAudits.concat(audits.filter((audit) => audit.value === "test!"));
      
      for (const audit of testAudits) {
        await localKv.delete(audit.key);
      }
    }
});

Deno.test("auditConnectionName", () => {
  const connection: KvConnection = {
    name: "name",
    environment: "local",
    id: "id",
    infra: "local",
    size: 100,
    kvLocation: "kvLocation",
  };
  assertEquals(auditConnectionName(connection), "name (local), id");
});

function getAudit(): GetAuditLog {
  return {
    key: "key",
    resultVersionstamp: "versionstamp",
    readUnitsConsumed: 1,
    executorId: "test!",
    auditType: "get",
    connection: "connection",
    infra: "local",
    rtms: 100,
  };
}
