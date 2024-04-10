import { assert } from "@std/assert";
import { assertEquals } from "@std/assert";
import { assertGreater } from "@std/assert";
import { assertGreaterOrEqual } from "@std/assert";
import { assertRejects } from "@std/assert";
import { KvListOptions, ListAuditLog, ListResults } from "../../types.ts";
import { abort, getUserState } from "../state/state.ts";
import { cleanup, createDb, DB_ID, SESSION_ID } from "../test/testUtils.ts";
import { localKv } from "./db.ts";
import { listKv } from "./kvList.ts";

Deno.test("kvList - all results in cache, no further results available", async () => {
  const kv = await createDb();
  await setupData(kv);
  setupCache(false);
  try {
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: `"prefix"`,
      start: "",
      end: "",
      limit: "10",
      reverse: false,
      disableCache: false,
      disableAudit: false,
    };

    const result = await listKv(options);

    // As cached cursor is false, it indicates that no further results are available
    assertEquals(result.results?.length, 1);
    assertEquals(result.results![0].key, ["prefix", "testKey-0"]);
    assertEquals(result.results![0].value, "testValue-0");
    assertEquals(result.cursor, false);
    assertEquals(result.aborted, false);
    assertEquals(result.opStats.cachedResults, 1);
    assertEquals(result.opStats.kvResults, 0);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 0);
    assertGreaterOrEqual(result.opStats.rtms, 0);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvList - all results in cache, further results are possible", async () => {
  const kv = await createDb();
  await setupData(kv);
  try {
    const listIterator = kv.list({ prefix: ["prefix"] });
    await listIterator.next();
    setupCache(listIterator.cursor);
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: `"prefix"`,
      start: "",
      end: "",
      limit: "1",
      reverse: false,
      disableCache: false,
      disableAudit: false,
    };

    const result = await listKv(options);

    assertEquals(result.results?.length, 1);
    assertEquals(result.results![0].key, ["prefix", "testKey-0"]);
    assertEquals(result.results![0].value, "testValue-0");
    assert(result.cursor);
    assertEquals(result.aborted, false);
    assertEquals(result.opStats.cachedResults, 1);
    assertEquals(result.opStats.kvResults, 0);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 0);
    assertGreaterOrEqual(result.opStats.rtms, 0);
    //no audit record is created as the results are cached
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvList - some results in cache", async () => {
  const kv = await createDb();
  await setupData(kv);
  try {
    const listIterator = kv.list({ prefix: ["prefix"] });
    await listIterator.next();
    setupCache(listIterator.cursor);
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: `"prefix"`,
      start: "",
      end: "",
      limit: "2",
      reverse: false,
      disableCache: false,
      disableAudit: false,
    };

    const result = await listKv(options);

    assertEquals(result.results?.length, 2);
    assertEquals(result.results![0].key, ["prefix", "testKey-0"]);
    assertEquals(result.results![0].value, "testValue-0");
    assertEquals(result.results![1].key, ["prefix", "testKey-1"]);
    assertEquals(result.results![1].value, "testValue-1");
    assert(result.cursor);
    assertEquals(result.aborted, false);
    assertEquals(result.opStats.cachedResults, 1);
    assertEquals(result.opStats.kvResults, 1);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 1);
    assertGreaterOrEqual(result.opStats.rtms, 0);

    await assertAuditRecord(`"prefix"`, "", "", "2", 1);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvList - no results in cache", async () => {
  const kv = await createDb();
  await setupData(kv);
  try {
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: "",
      start: "",
      end: "",
      limit: "2",
      reverse: false,
      disableCache: false,
      disableAudit: false,
    };

    const result = await listKv(options);

    assertEquals(result.results?.length, 2);
    assertEquals(result.results![0].key, ["prefix", "testKey-0"]);
    assertEquals(result.results![0].value, "testValue-0");
    assertEquals(result.results![1].key, ["prefix", "testKey-1"]);
    assertEquals(result.results![1].value, "testValue-1");
    assert(result.cursor);
    assertEquals(result.aborted, false);
    assertEquals(result.opStats.cachedResults, 0);
    assertEquals(result.opStats.kvResults, 2);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 1);
    assertGreaterOrEqual(result.opStats.rtms, 0);

    await assertAuditRecord("", "", "", "2", 2);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvList - specifying prefix, start and end is invalid", async () => {
  const kv = await createDb();
  try {
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: `"prefix"`,
      start: `"start"`,
      end: `"end"`,
      limit: "2",
      reverse: false,
      disableCache: false,
      disableAudit: false,
    };

    assertRejects(async () => {
      await listKv(options);
    }, "Cannot specify a prefix, start and end key.");
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvList - prefix only specified", async () => {
  const kv = await createDb();
  await setupData(kv);
  try {
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: `"prefix"`,
      start: "",
      end: "",
      limit: "2",
      reverse: false,
      disableCache: false,
      disableAudit: false,
    };

    const result = await listKv(options);

    assertEquals(result.results?.length, 2);
    assertEquals(result.results![0].key, ["prefix", "testKey-0"]);
    assertEquals(result.results![0].value, "testValue-0");
    assertEquals(result.results![1].key, ["prefix", "testKey-1"]);
    assertEquals(result.results![1].value, "testValue-1");
    assert(result.cursor);
    assertEquals(result.aborted, false);
    assertEquals(result.opStats.cachedResults, 0);
    assertEquals(result.opStats.kvResults, 2);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 1);
    assertGreaterOrEqual(result.opStats.rtms, 0);

    await assertAuditRecord(`"prefix"`, "", "", "2", 2);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvList - start only specified", async () => {
  const kv = await createDb();
  await setupData(kv);
  try {
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: "",
      start: `"prefix","testKey-2"`,
      end: "",
      limit: "2",
      reverse: false,
      disableCache: false,
      disableAudit: false,
    };

    const result = await listKv(options);

    assertEquals(result.results?.length, 2);
    assertEquals(result.results![0].key, ["prefix", "testKey-2"]);
    assertEquals(result.results![0].value, "testValue-2");
    assertEquals(result.results![1].key, ["prefix", "testKey-3"]);
    assertEquals(result.results![1].value, "testValue-3");
    assert(result.cursor);
    assertEquals(result.aborted, false);
    assertEquals(result.opStats.cachedResults, 0);
    assertEquals(result.opStats.kvResults, 2);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 1);
    assertGreaterOrEqual(result.opStats.rtms, 0);

    await assertAuditRecord("", `"prefix","testKey-2"`, "", "2", 2);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvList - end only specified", async () => {
  const kv = await createDb();
  await setupData(kv);
  try {
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: "",
      start: "",
      end: `"prefix","testKey-2"`,
      limit: "10",
      reverse: false,
      disableCache: false,
      disableAudit: false,
    };

    const result = await listKv(options);

    assertEquals(result.results?.length, 2);
    assertEquals(result.results![0].key, ["prefix", "testKey-0"]);
    assertEquals(result.results![0].value, "testValue-0");
    assertEquals(result.results![1].key, ["prefix", "testKey-1"]);
    assertEquals(result.results![1].value, "testValue-1");
    assert(!result.cursor);
    assertEquals(result.aborted, false);
    assertEquals(result.opStats.cachedResults, 0);
    assertEquals(result.opStats.kvResults, 2);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 1);
    assertGreaterOrEqual(result.opStats.rtms, 0);

    await assertAuditRecord("", "", `"prefix","testKey-2"`, "10", 2);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvList - reverse specified", async () => {
  const kv = await createDb();
  await setupData(kv);
  try {
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: "",
      start: "",
      end: "",
      limit: "2",
      reverse: true,
      disableCache: false,
      disableAudit: false,
    };

    const result = await listKv(options);

    assertEquals(result.results?.length, 2);
    assertEquals(result.results![0].key, ["prefix", "testKey-9"]);
    assertEquals(result.results![0].value, "testValue-9");
    assertEquals(result.results![1].key, ["prefix", "testKey-8"]);
    assertEquals(result.results![1].value, "testValue-8");
    assert(result.cursor);
    assertEquals(result.aborted, false);
    assertEquals(result.opStats.cachedResults, 0);
    assertEquals(result.opStats.kvResults, 2);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 1);
    assertGreaterOrEqual(result.opStats.rtms, 0);

    await assertAuditRecord("", "", "", "2", 2, true);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvList - some results cached, then all results cached", async () => {
  const kv = await createDb();
  await setupData(kv);
  try {
    const listIterator = kv.list({ prefix: ["prefix"] });
    await listIterator.next();
    setupCache(listIterator.cursor);
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: `"prefix"`,
      start: "",
      end: "",
      limit: "2",
      reverse: false,
      disableCache: false,
      disableAudit: false,
    };

    //first list call, some results in cache
    let result = await listKv(options);

    assertEquals(result.results?.length, 2);
    assertEquals(result.results![0].key, ["prefix", "testKey-0"]);
    assertEquals(result.results![0].value, "testValue-0");
    assertEquals(result.results![1].key, ["prefix", "testKey-1"]);
    assertEquals(result.results![1].value, "testValue-1");
    assert(result.cursor);
    assertEquals(result.aborted, false);
    assertEquals(result.opStats.cachedResults, 1);
    assertEquals(result.opStats.kvResults, 1);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 1);
    assertGreaterOrEqual(result.opStats.rtms, 0);

    await assertAuditRecord(`"prefix"`, "", "", "2", 1);

    //second list call, all results are from cache
    result = await listKv(options);

    assertEquals(result.results?.length, 2);
    assertEquals(result.results![0].key, ["prefix", "testKey-0"]);
    assertEquals(result.results![0].value, "testValue-0");
    assertEquals(result.results![1].key, ["prefix", "testKey-1"]);
    assertEquals(result.results![1].value, "testValue-1");
    assert(result.cursor);
    assertEquals(result.aborted, false);
    assertEquals(result.opStats.cachedResults, 2);
    assertEquals(result.opStats.kvResults, 0);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 0);
    assertGreaterOrEqual(result.opStats.rtms, 0);

    await assertAuditRecord(`"prefix"`, "", "", "2", 1);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvList - cache disabled", async () => {
  const kv = await createDb();
  await setupData(kv);
  try {
    const listIterator = kv.list({ prefix: ["prefix"] });
    await listIterator.next();
    setupCache(listIterator.cursor, 10);
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: `"prefix"`,
      start: "",
      end: "",
      limit: "2",
      reverse: false,
      disableCache: false,
      disableAudit: false,
    };

    //first list call, both results are from cache
    let result = await listKv(options);

    const state = getUserState(SESSION_ID);
    const cacheParams = {
      connectionId: DB_ID,
      prefix: `"prefix"`,
      start: "",
      end: "",
      reverse: false,
    };
    assertEquals(state.cache.get(cacheParams)?.dataRetrieved.length, 10);
    assertEquals(result.results?.length, 2);
    assertEquals(result.opStats.cachedResults, 2);

    //second list call, cache is disabled, so no results are from cache
    options.disableCache = true;
    result = await listKv(options);

    assertEquals(state.cache.get(cacheParams)?.dataRetrieved.length, 2);
    assertEquals(result.results![0].key, ["prefix", "testKey-0"]);
    assertEquals(result.results![0].value, "testValue-0");
    assertEquals(result.results![1].key, ["prefix", "testKey-1"]);
    assertEquals(result.results![1].value, "testValue-1");
    assert(result.cursor);
    assertEquals(result.aborted, false);
    assertEquals(result.opStats.cachedResults, 0);
    assertEquals(result.opStats.kvResults, 2);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 1);
    assertGreaterOrEqual(result.opStats.rtms, 0);
    await assertAuditRecord(`"prefix"`, "", "", "2", 2);
  } finally {
    await cleanup(kv);
  }
});

Deno.test("kvList - no results in cache, user aborts", async () => {
  const kv = await createDb();
  await setupData(kv);
  try {
    const options: KvListOptions = {
      session: SESSION_ID,
      connectionId: DB_ID,
      prefix: "",
      start: "",
      end: "",
      limit: "10",
      reverse: false,
      disableCache: false,
      disableAudit: false,
      abortId: "abort",
    };

    await abort("abort");
    const result = await listKv(options);

    assertEquals(result.results?.length, 1);
    assertEquals(result.results![0].key, ["prefix", "testKey-0"]);
    assertEquals(result.results![0].value, "testValue-0");
    assert(result.cursor);
    assertEquals(result.aborted, true);
    assertEquals(result.opStats.cachedResults, 0);
    assertEquals(result.opStats.kvResults, 1);
    assertEquals(result.opStats.opType, "read");
    assertEquals(result.opStats.unitsConsumed, 1);
    assertGreaterOrEqual(result.opStats.rtms, 0);

    await assertAuditRecord("", "", "", "10", 1, false, true);
  } finally {
    await cleanup(kv);
  }
});

async function setupData(kv: Deno.Kv) {
  for (let i = 0; i < 10; i++) {
    await kv.set([`prefix`, `testKey-${i}`], `testValue-${i}`);
  }
}

function setupCache(cursor: string | false, numResultsToCache = 1) {
  const state = getUserState(SESSION_ID);

  const results = [];
  for (let i = 0; i < numResultsToCache; i++) {
    results.push({
      key: ["prefix", `testKey-${i}`],
      value: `testValue-${i}`,
      versionstamp: "testVersionstamp",
    });
  }

  const listResults: ListResults = {
    connectionId: DB_ID,
    prefix: `"prefix"`,
    start: "",
    end: "",
    reverse: false,
    results,
    cursor,
  };
  state.cache.set(listResults);
}

async function assertAuditRecord(
  prefix: string,
  start: string,
  end: string,
  limit: string,
  numResults: number,
  reverse = false,
  aborted = false,
) {
  const auditRecordEntry = await Array.fromAsync(
    localKv.list<ListAuditLog>({ prefix: ["audit"] }, { limit: 1, reverse: true }),
  );
  const auditRecord = auditRecordEntry[0].value;
  assert(auditRecord);
  assertEquals(auditRecord.auditType, "list");
  assertEquals(auditRecord.executorId, SESSION_ID);
  assertEquals(auditRecord.prefixKey, prefix);
  assertEquals(auditRecord.startKey, start);
  assertEquals(auditRecord.endKey, end);
  assertEquals(auditRecord.limit, limit);
  assertEquals(auditRecord.reverse, reverse);
  assertEquals(auditRecord.results, numResults);
  assertGreater(auditRecord.readUnitsConsumed, 0);
  assertEquals(auditRecord.connection, "test-" + DB_ID + " (local), " + DB_ID);
  assertEquals(auditRecord.infra, "local");
  assertEquals(auditRecord.rtms >= 0, true);
  assertEquals(auditRecord.aborted, aborted);
}
