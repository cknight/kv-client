import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { join } from "$std/path/join.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { CopyAuditLog } from "../../types.ts";
import { logout } from "../../utils/user/logout.ts";
import { localKv } from "../../utils/kv/db.ts";
import { addTestConnection } from "../../utils/test/testUtils.ts";
import { createFreshCtx, SESSION_ID } from "../../utils/test/testUtils.ts";
import { CopyKeyData, handler } from "./copyKey.tsx";

const TEST_DB_PATH = "testDb" + crypto.randomUUID();
const SOURCE = "test_source.db";
const DEST = "test_dest.db";
const KEY_TO_COPY = "key_to_copy";

Deno.test("Copy - silly test", async () => {
  const { sourceKv, destKv } = await addSourceAndDestDbs();
  try {
    await sourceKv.set([KEY_TO_COPY], "value_to_copy");
    const requestData: CopyKeyData = {
      sourceConnectionId: "123",
      destConnectionId: "456",
      keyToCopy: `"${KEY_TO_COPY}"`,
    };

    const request = new Request("http://localhost:8080/api/export/copyKey", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
    const ctx = createFreshCtx(request);
    assert(handler.POST);
    const resp = await handler.POST(request, ctx);
    assertEquals(resp.status, 200);
  } finally {
    await cleanup(sourceKv, destKv);
  }
});

Deno.test("Copy Key - happy path", async () => {
  assert(handler.POST);

  const { sourceKv, destKv } = await addSourceAndDestDbs();

  try {
    await sourceKv.set([KEY_TO_COPY], "value_to_copy");

    const requestData: CopyKeyData = {
      sourceConnectionId: "123",
      destConnectionId: "456",
      keyToCopy: `"${KEY_TO_COPY}"`,
    };

    const request = new Request("http://localhost:8080/api/export/copyKey", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
    const ctx = createFreshCtx(request);
    const resp = await handler.POST(request, ctx);
    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), "KV entry successfully copied");
    const entry = await destKv.get([KEY_TO_COPY]);
    assertEquals(entry.value, "value_to_copy");

    await assertAuditRecord();
  } finally {
    await cleanup(sourceKv, destKv);
  }
});

Deno.test("Copy Key - key not found", async () => {
  assert(handler.POST);

  const { sourceKv, destKv } = await addSourceAndDestDbs();

  try {
    await sourceKv.set([KEY_TO_COPY], "value_to_copy");

    const requestData: CopyKeyData = {
      sourceConnectionId: "123",
      destConnectionId: "456",
      keyToCopy: `"this key does not exist"`,
    };

    const request = new Request("http://localhost:8080/api/export/copyKey", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
    const ctx = createFreshCtx(request);
    const resp = await handler.POST(request, ctx);
    assertEquals(resp.status, 500);
    assertEquals(await resp.text(), "Failed to copy entry");
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

  await Deno.remove(join(Deno.cwd(), TEST_DB_PATH), { recursive: true });
  await logout(SESSION_ID);
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
