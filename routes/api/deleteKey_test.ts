import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { join } from "$std/path/join.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { DeleteAuditLog, ListResults, State } from "../../types.ts";
import { logout } from "../../utils/user/logout.ts";
import { localKv } from "../../utils/kv/db.ts";
import { getUserState } from "../../utils/state/state.ts";
import { addTestConnection, createFreshCtx, SESSION_ID } from "../../utils/test/testUtils.ts";
import { DeleteKeyData, handler } from "./deleteKey.tsx";

const TEST_DB_PATH = "testDb" + crypto.randomUUID();
const SOURCE = "test_source.db";
const KEY_TO_DELETE = "key_to_delete";

Deno.test("Delete key - happy path", async () => {
  const kv = await createDb();

  try {
    const state = getUserState(SESSION_ID);
    await kv.set([KEY_TO_DELETE], "value_to_copy");
    const entryToCache = await kv.get([KEY_TO_DELETE]);
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

    const requestData: DeleteKeyData = {
      connectionId: "123",
      keyToDelete: `"${KEY_TO_DELETE}"`,
    };

    const resp = await callAPI(requestData, state);
    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), "KV entry successfully deleted");

    //validate key deleted
    const entry = await kv.get([KEY_TO_DELETE]);
    assertEquals(entry.value, null);
    assertEquals(entry.versionstamp, null);

    await assertAuditRecord();
  } finally {
    kv.close();
    await localKv.delete([CONNECTIONS_KEY_PREFIX, SOURCE]);
    await logout(SESSION_ID);
    await Deno.remove(join(Deno.cwd(), TEST_DB_PATH), { recursive: true });
  }
});

async function callAPI(requestData: DeleteKeyData, state: State) {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/export/deleteKey", {
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
  assertEquals(auditRecord.rtms >= 0, true);
  assertEquals(auditRecord.keysDeleted, 1);
  assertEquals(auditRecord.keysFailed, 0);
  assertEquals(auditRecord.aborted, false);
  assertEquals(auditRecord.writeUnitsConsumed, 1);
}

async function createDb(): Promise<Deno.Kv> {
  await Deno.mkdir(TEST_DB_PATH);
  const sourceDbPath = join(Deno.cwd(), TEST_DB_PATH, "test_source.db");
  await addTestConnection(sourceDbPath, "123");
  const sourceKv = await Deno.openKv(sourceDbPath);
  return sourceKv;
}
