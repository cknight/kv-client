import { assert } from "@std/assert";
import { assertEquals } from "@std/assert/assert-equals";
import { join } from "@std/path";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { ImportAuditLog } from "../../types.ts";
import { localKv } from "../../utils/kv/db.ts";
import { abort } from "../../utils/state/state.ts";
import {
  addTestConnection,
  cleanup,
  createFreshCtx,
  DB_ID,
  SESSION_ID,
} from "../../utils/test/testUtils.ts";
import { shortHash } from "../../utils/utils.ts";
import { handler } from "../api/import.tsx";

const TEST_DB_PATH = "testDb" + crypto.randomUUID();
const IMPORT_FROM = join(Deno.cwd(), TEST_DB_PATH, "import_from.db");
const IMPORT_INTO = join(Deno.cwd(), TEST_DB_PATH, "import_into.db");
const FROM_ID = await shortHash(IMPORT_FROM);

Deno.test("Import file to KV - happy path file", async () => {
  let intoKv: Deno.Kv | undefined;
  try {
    //'from' db is used to create the file to import
    intoKv = await createDbs();
    const fromFile = Deno.readFileSync(join(Deno.cwd(), TEST_DB_PATH, "import_from.db"));
    const formData = new FormData();
    formData.append("importFile", new Blob([fromFile], { type: "application/octet-stream" }));
    formData.append("connectionId", DB_ID);

    const preEntry1 = await intoKv.get(["testKey"]);
    const preEntry2 = await intoKv.get(["testKey2"]);
    assertEquals(preEntry1.value, null);
    assertEquals(preEntry2.value, null);

    const resp = await callAPI(formData);
    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), "All 2 keys successfully imported");
    const entry1 = await intoKv.get(["testKey"]);
    const entry2 = await intoKv.get(["testKey2"]);
    assertEquals(entry1.value, "testValue");
    assertEquals(entry2.value, "testValue2");
    await assertAuditRecord("File: blob", "file");
  } finally {
    await cleanup(intoKv);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, FROM_ID]);
    try {
      await Deno.remove(join(Deno.cwd(), TEST_DB_PATH), { recursive: true });
    } catch (_e) { /* ignore */ }
  }
});

Deno.test("Import file to KV - happy path connection", async () => {
  let intoKv: Deno.Kv | undefined;
  try {
    //'from' db is used to create the file to import
    intoKv = await createDbs();
    await addTestConnection(IMPORT_FROM, FROM_ID);
    const formData = new FormData();
    formData.append("connectionId", DB_ID);
    formData.append("importSource", FROM_ID);

    const preEntry1 = await intoKv.get(["testKey"]);
    const preEntry2 = await intoKv.get(["testKey2"]);
    assertEquals(preEntry1.value, null);
    assertEquals(preEntry2.value, null);

    const resp = await callAPI(formData);
    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), "All 2 keys successfully imported");
    const entry1 = await intoKv.get(["testKey"]);
    const entry2 = await intoKv.get(["testKey2"]);
    assertEquals(entry1.value, "testValue");
    assertEquals(entry2.value, "testValue2");
    await assertAuditRecord(`test-${FROM_ID} (local), ${FROM_ID}`, "local");
  } finally {
    await cleanup(intoKv);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, FROM_ID]);
    try {
      await Deno.remove(join(Deno.cwd(), TEST_DB_PATH), { recursive: true });
    } catch (_e) { /* ignore */ }
  }
});

Deno.test("Import file to KV - File aborted", async () => {
  let intoKv: Deno.Kv | undefined;
  try {
    //'from' db is used to create the file to import
    intoKv = await createDbs();
    const fromFile = Deno.readFileSync(join(Deno.cwd(), TEST_DB_PATH, "import_from.db"));
    const formData = new FormData();
    formData.append("importFile", new Blob([fromFile], { type: "application/octet-stream" }));
    formData.append("connectionId", DB_ID);
    formData.append("abortId", "abort-1234");

    const preEntry1 = await intoKv.get(["testKey"]);
    const preEntry2 = await intoKv.get(["testKey2"]);
    assertEquals(preEntry1.value, null);
    assertEquals(preEntry2.value, null);

    await abort("abort-1234");

    const resp = await callAPI(formData);
    assertEquals(resp.status, 499);
    assertEquals(await resp.text(), "Import aborted.  0 out of 2 keys imported (0% complete).");
    const entry1 = await intoKv.get(["testKey"]);
    const entry2 = await intoKv.get(["testKey2"]);
    assertEquals(entry1.value, null);
    assertEquals(entry2.value, null);
    await assertAbortedAuditRecord("File: blob", "file");
  } finally {
    await cleanup(intoKv);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, FROM_ID]);
    try {
      await Deno.remove(join(Deno.cwd(), TEST_DB_PATH), { recursive: true });
    } catch (_e) { /* ignore */ }
  }
});

Deno.test("Import file to KV - Connection aborted", async () => {
  let intoKv: Deno.Kv | undefined;
  try {
    //'from' db is used to create the file to import
    intoKv = await createDbs();
    await addTestConnection(IMPORT_FROM, FROM_ID);
    const formData = new FormData();
    formData.append("connectionId", DB_ID);
    formData.append("importSource", FROM_ID);
    formData.append("abortId", "abort-1234");

    const preEntry1 = await intoKv.get(["testKey"]);
    const preEntry2 = await intoKv.get(["testKey2"]);
    assertEquals(preEntry1.value, null);
    assertEquals(preEntry2.value, null);

    await abort("abort-1234");

    const resp = await callAPI(formData);
    assertEquals(resp.status, 499);
    assertEquals(await resp.text(), "Import aborted.  No keys were imported.");
    const entry1 = await intoKv.get(["testKey"]);
    const entry2 = await intoKv.get(["testKey2"]);
    assertEquals(entry1.value, null);
    assertEquals(entry2.value, null);
    await assertAbortedAuditRecord(`test-${FROM_ID} (local), ${FROM_ID}`, "local");
  } finally {
    await cleanup(intoKv);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, FROM_ID]);
    try {
      await Deno.remove(join(Deno.cwd(), TEST_DB_PATH), { recursive: true });
    } catch (_e) { /* ignore */ }
  }
});

Deno.test("Import file to KV - no connection Id", async () => {
  const formData = new FormData();
  formData.append("importFile", new Blob([], { type: "application/octet-stream" }));
  const resp = await callAPI(formData);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No connectionId provided");
});

async function callAPI(requestData: FormData) {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/import", {
    method: "POST",
    body: requestData,
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  return resp;
}

async function assertAuditRecord(importSource: string, importInfra: string) {
  const auditRecordEntry = await Array.fromAsync(
    localKv.list<ImportAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.auditType, "import");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.connection, "test-" + DB_ID + " (local), " + DB_ID);
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.rtms >= 0, true);
  assertEquals(auditRecord.importSource, importSource);
  assertEquals(auditRecord.importInfra, importInfra);
  assertEquals(auditRecord.keysImported, 2);
  assertEquals(auditRecord.keysFailed, 0);
  assertEquals(auditRecord.aborted, false);
  assertEquals(auditRecord.writeUnitsConsumed, 1);
  assertEquals(auditRecord.readUnitsConsumed, 1);
}

async function assertAbortedAuditRecord(importSource: string, importInfra: string) {
  const auditRecordEntry = await Array.fromAsync(
    localKv.list<ImportAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.auditType, "import");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.connection, "test-" + DB_ID + " (local), " + DB_ID);
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.rtms >= 0, true);
  assertEquals(auditRecord.importSource, importSource);
  assertEquals(auditRecord.importInfra, importInfra);
  assertEquals(auditRecord.keysImported, 0);
  assertEquals(auditRecord.keysFailed, 0);
  assertEquals(auditRecord.aborted, true);
  assertEquals(auditRecord.writeUnitsConsumed, 0);
  assertEquals(auditRecord.readUnitsConsumed, 1);
}

async function createDbs(): Promise<Deno.Kv> {
  await Deno.mkdir(TEST_DB_PATH);
  const fromKv = await Deno.openKv(IMPORT_FROM);
  await fromKv.set(["testKey"], "testValue");
  await fromKv.set(["testKey2"], "testValue2");
  fromKv.close();

  await addTestConnection(IMPORT_INTO, DB_ID);
  const intoKv = await Deno.openKv(IMPORT_INTO);
  return intoKv;
}
