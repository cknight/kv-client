import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { join } from "$std/path/join.ts";
import { CONNECTIONS_KEY_PREFIX, EXPORT_PATH } from "../../../consts.ts";
import { ExportAuditLog, QueueDeleteExportFile, QueueDeleteExportStatus } from "../../../types.ts";
import { logout } from "../../../utils/connections/denoDeploy/logout.ts";
import { localKv } from "../../../utils/kv/db.ts";
import { _internals } from "../../../utils/kv/kvQueue.ts";
import { abort, getExportStatus } from "../../../utils/state/state.ts";
import {
  addTestConnection,
  createFreshCtx,
  disableQueue,
  SESSION_ID,
} from "../../../utils/test/testUtils.ts";
import { handler } from "./initiate.tsx";

const test = Deno.test;

test("No connectionId provided returns 400", async () => {
  assert(handler.POST);

  const formData = new FormData();
  const request = new Request("http://localhost:8080/api/export/initiate", {
    method: "POST",
    body: formData,
  });

  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No connectionId provided");
});

test("No exportId provided returns 400", async () => {
  assert(handler.POST);

  const formData = new FormData();
  formData.append("connectionId", "123");
  const request = new Request("http://localhost:8080/api/export/initiate", {
    method: "POST",
    body: formData,
  });

  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No exportId provided");
});

test({
  name: "Initiate export - happy path",
  sanitizeResources: true,
  async fn() {
    const testDb = await getTestDbPath();
    let tempDbFile: string | undefined;
    let enqueueCount = 1;

    try {
      // deno-lint-ignore require-await
      _internals.enqueue = async (
        msg: unknown,
        delay: number,
      ) => {
        if (enqueueCount === 1) {
          assertEquals((msg as QueueDeleteExportStatus).message.exportId, "456");
          assertEquals(delay, 10 * 60 * 1000);
        } else if (enqueueCount === 2) {
          const tempDbFile = (await localKv.get<string>([EXPORT_PATH, SESSION_ID, "456"])).value;
          assertEquals((msg as QueueDeleteExportFile).message.exportId, "456");
          assertEquals((msg as QueueDeleteExportFile).message.tempDirPath, tempDbFile);
          assertEquals(delay, 24 * 60 * 60 * 1000);
        } else {
          console.log("Unexpected call to enqueue", msg, delay);
          throw new Error("Unexpected call to enqueue");
        }
        enqueueCount++;
      };

      assert(handler.POST);

      // create a local db, populate with test data and add a connection to it (id: 123)
      await populateSimulatedLocalKv(testDb, 1005);
      await addTestConnection(testDb, "123");

      const formData = new FormData();
      formData.append("connectionId", "123");
      formData.append("exportId", "456");
      const request = new Request("http://localhost:8080/api/export/initiate", {
        method: "POST",
        body: formData,
      });
      const ctx = createFreshCtx(request);

      //This processes the export in the background and will immediately return a 200, initiating the export
      const resp = await handler.POST(request, ctx);
      assertEquals(resp.status, 200);
      assertEquals(await resp.text(), "Export initiated");

      const status = getExportStatus("456");
      assertEquals(status?.status, "initiating");

      await waitForExportToComplete("complete", "456", 0);

      tempDbFile = await assertRecordsInTempDbFile();

      await assertAuditRecord();
    } finally {
      tempDbFile && await Deno.remove(tempDbFile);
      await deleteTempDbFolder();
      await localKv.delete([EXPORT_PATH, SESSION_ID, "456"]);
      await localKv.delete([CONNECTIONS_KEY_PREFIX, "123"]);
      await logout(SESSION_ID);
    }
  },
});

test({
  name: "Initiate export - exception occurs",
  sanitizeResources: true,
  async fn() {
    const testDb = await getTestDbPath();
    let tempDbFile: string | undefined;
    let thrown = false;
    try {
      // deno-lint-ignore require-await
      _internals.enqueue = async (
        msg: unknown,
        delay: number,
      ) => {
        if (!thrown) {
          thrown = true;
          throw new Error("Force test error");
        }
      };

      assert(handler.POST);

      // create a local db, populate with test data and add a connection to it (id: 123)
      await populateSimulatedLocalKv(testDb, 1005);
      await addTestConnection(testDb, "123");

      const formData = new FormData();
      formData.append("connectionId", "123");
      formData.append("exportId", "456");
      const request = new Request("http://localhost:8080/api/export/initiate", {
        method: "POST",
        body: formData,
      });
      const ctx = createFreshCtx(request);

      //This processes the export in the background and will immediately return a 200, initiating the export
      const resp = await handler.POST(request, ctx);
      assertEquals(resp.status, 200);
      assertEquals(await resp.text(), "Export initiated");

      const status = getExportStatus("456");
      assertEquals(status?.status, "initiating");

      await waitForExportToComplete("failed", "456", 0);

      await assertAuditRecord();
    } finally {
      tempDbFile && await Deno.remove(tempDbFile);
      await deleteTempDbFolder();
      await localKv.delete([EXPORT_PATH, SESSION_ID, "456"]);
      await localKv.delete([CONNECTIONS_KEY_PREFIX, "123"]);
      await logout(SESSION_ID);
    }
  },
});

test({
  name: "Initiate export - user aborts",
  sanitizeResources: true,
  async fn() {
    const testDb = await getTestDbPath();
    let tempDbFile: string | undefined;

    try {
      disableQueue();

      assert(handler.POST);

      // create a local db, populate with test data and add a connection to it (id: 123)
      await populateSimulatedLocalKv(testDb, 30000);
      await addTestConnection(testDb, "123");

      const formData = new FormData();
      formData.append("connectionId", "123");
      formData.append("exportId", "456");
      const request = new Request("http://localhost:8080/api/export/initiate", {
        method: "POST",
        body: formData,
      });
      const ctx = createFreshCtx(request);

      //This processes the export in the background and will immediately return a 200, initiating the export
      const resp = await handler.POST(request, ctx);
      assertEquals(resp.status, 200);
      assertEquals(await resp.text(), "Export initiated");

      const status = getExportStatus("456");
      assertEquals(status?.status, "initiating");
      console.log("Initiated export");
      await waitForExportToComplete("in progress", "456", 0);
      await abort("456");
      await waitForExportToComplete("aborted", "456", 0);

      await assertAbortedAuditRecord();
    } finally {
      tempDbFile && await Deno.remove(tempDbFile);
      await deleteTempDbFolder();
      await localKv.delete([EXPORT_PATH, SESSION_ID, "456"]);
      await localKv.delete([CONNECTIONS_KEY_PREFIX, "123"]);
      await logout(SESSION_ID);
    }
  },
});

async function deleteTempDbFolder() {
  await Deno.remove(join(Deno.cwd(), "testDb"), { recursive: true });
}

async function getTestDbPath() {
  await Deno.mkdir("testDb");
  const testDb = join(Deno.cwd(), "testDb", "test.db");
  return testDb;
}

async function waitForExportToComplete(
  expectedStatus: string,
  exportId: string,
  attempt: number,
): Promise<void> {
  if (attempt++ > 20) {
    throw new Error("Export did not complete for status: " + expectedStatus);
  }
  const status = getExportStatus(exportId);
  console.log("found status", status?.status, "expected status", expectedStatus);
  if (status?.status === expectedStatus) {
    return Promise.resolve();
  } else {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(waitForExportToComplete(expectedStatus, exportId, attempt));
      }, 100);
    });
  }
}

async function assertAuditRecord() {
  const auditRecordEntry = await Array.fromAsync(
    localKv.list<ExportAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.aborted, false);
  assertEquals(auditRecord.bytesRead, 4096);
  assertEquals(auditRecord.auditType, "export");
  assertEquals(auditRecord.connection, "test-123 (local), 123");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.keysExported, 1005);
  assertEquals(auditRecord.rtms > 0, true);
  assertEquals(auditRecord.readUnitsConsumed, 8);
}

async function assertAbortedAuditRecord() {
  const auditRecordEntry = await Array.fromAsync(
    localKv.list<ExportAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.aborted, true);
  assertEquals(auditRecord.bytesRead > 0, true);
  assertEquals(auditRecord.auditType, "export");
  assertEquals(auditRecord.connection, "test-123 (local), 123");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.keysExported > 0, true);
  assertEquals(auditRecord.rtms > 0, true);
  assertEquals(auditRecord.readUnitsConsumed > 0, true);
}

async function assertRecordsInTempDbFile() {
  const tempDbFile = (await localKv.get<string>([EXPORT_PATH, SESSION_ID, "456"])).value;
  assert(tempDbFile);
  const tempDbKv = await Deno.openKv(tempDbFile);
  const entries = await Array.fromAsync(tempDbKv.list<string>({ prefix: [] }));
  tempDbKv.close();
  const dataMap = new Map<string, string>();
  entries.map((key) => {
    dataMap.set(key.key[0] as string, key.value);
  });
  assertEquals(dataMap.size, 1005);
  for (let i = 0; i < 1005; i++) {
    assertEquals(dataMap.get(`key-${i}`), `value-${i}`);
  }
  return tempDbFile;
}

async function populateSimulatedLocalKv(testDb: string, numberKeys: number) {
  const tempKv = await Deno.openKv(testDb);
  for (let i = 0; i < numberKeys; i++) {
    await tempKv.set([`key-${i}`], `value-${i}`);
  }
  tempKv.close();
}
