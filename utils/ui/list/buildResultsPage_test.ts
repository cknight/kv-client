import { assertRejects } from "$std/assert/assert_rejects.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { State } from "../../../types.ts";
import { CacheInvalidationError } from "../../errors.ts";
import { getUserState } from "../../state/state.ts";
import { DB_ID, SESSION_ID } from "../../test/testUtils.ts";
import { buildResultsPage, entriesToOperateOn, KeyOperationData } from "./buildResultsPage.ts";
import { hashKvKey } from "../../utils.ts";

const defaultOperationData: KeyOperationData = {
  connectionId: DB_ID,
  keysSelected: [],
  prefix: "",
  start: "",
  end: "",
  from: 1,
  show: 10,
  reverse: false,
};

Deno.test("entriesToOperateOn - no connection", async () => {
  await assertRejects(
    async () => {
      await entriesToOperateOn(defaultOperationData, SESSION_ID);
    },
    Error,
    "Internal error.  Connection not active.  Aborting.",
  );

  const state = getUserState(SESSION_ID);
  state.connection = {
    id: "not the right connection",
    kvLocation: "not the right location",
    environment: "local",
    name: "not the right name",
    infra: "local",
    size: 0,
  };
  await assertRejects(
    async () => {
      await entriesToOperateOn(defaultOperationData, SESSION_ID);
    },
    Error,
    "Internal error.  Connection not active.  Aborting.",
  );
});

Deno.test("entriesToOperateOn - no cache", () => {
  setupState();
  assertRejects(
    async () => {
      await entriesToOperateOn(defaultOperationData, SESSION_ID);
    },
    CacheInvalidationError,
    "Cache data not found.  This can happen if the data has been changed through this UI.  Please reload the data and try again.",
  );
});

Deno.test("entriesToOperateOn - no keys selected", async () => {
  const state = setupState();
  addToCache(state, 10);
  const results = await entriesToOperateOn(defaultOperationData, SESSION_ID);
  assertEquals(results.length, 10);
});

Deno.test("entriesToOperateOn - no keys selected, filter", async () => {
  const state = setupState();
  addToCache(state, 100);
  const results = await entriesToOperateOn({
    ...defaultOperationData,
    filter: "1",
    from: 3,
  }, SESSION_ID);
  assertEquals(results.length, 19);
});

Deno.test("entriesToOperateOn - keys selected", async () => {
  addToCache(setupState(), 100);
  const results = await entriesToOperateOn({
    ...defaultOperationData,
    keysSelected: [await hashKvKey(["testKey3"]), await hashKvKey(["testKey7"])],
  }, SESSION_ID);
  assertEquals(results.length, 2);
  assertEquals(results[0].key, ["testKey3"]);
  assertEquals(results[1].key, ["testKey7"]);
});

Deno.test("entriesToOperateOn - key selected mismatch", async () => {
  addToCache(setupState(), 100);
  await assertRejects(
    async () => {
      await entriesToOperateOn({
        ...defaultOperationData,
        keysSelected: [await hashKvKey(["testKey-does not exist"]), await hashKvKey(["testKey7"])],
      }, SESSION_ID);
    },
    Error,
    "Internal error.  Mismatch between keys to operate on and keys retrieved from cache.  Aborting.",
  );
});

Deno.test("buildResultsPage - no filter, no results", () => {
  const results = buildResultsPage(undefined, [], 0, 10, SESSION_ID);
  assertEquals(results.resultsPage.length, 0);
  assertEquals(results.resultsWorkingSet.length, 0);
});

Deno.test("buildResultsPage - no filter, results", () => {
  const results = buildResultsPage(undefined, createResults(100), 3, 10, SESSION_ID);
  assertEquals(results.resultsPage.length, 10);
  assertEquals(results.resultsWorkingSet.length, 100);
  assertEquals(results.resultsPage[0].key, ["testKey2"]);
  assertEquals(results.resultsPage[9].key, ["testKey11"]);
});

Deno.test("buildResultsPage - filter, no results", () => {
  const results = buildResultsPage("1", [], 0, 10, SESSION_ID);
  assertEquals(results.resultsPage.length, 0);
  assertEquals(results.resultsWorkingSet.length, 0);
});

Deno.test("buildResultsPage - filter, results", () => {
  const results = buildResultsPage("1", createResults(100), 3, 10, SESSION_ID);
  assertEquals(results.resultsPage.length, 10);
  assertEquals(results.resultsWorkingSet.length, 19);
  //first two entries (1, 10) are skipped.  10 results are 11,12,13,14,15,16,17,18,19,21
  assertEquals(results.resultsPage[0].key, ["testKey11"]);
  assertEquals(results.resultsPage[9].key, ["testKey21"]);
});

function setupState(): State {
  const state = getUserState(SESSION_ID);
  state.connection = {
    id: DB_ID,
    kvLocation: "some location",
    environment: "local",
    name: "some name",
    infra: "local",
    size: 0,
  };
  return state;
}

function addToCache(state: State, numResults: number) {
  state.cache.set({
    connectionId: DB_ID,
    prefix: "",
    start: "",
    end: "",
    reverse: false,
    cursor: "testCursor",
    results: createResults(numResults),
  });
}

function createResults(numResults: number): Deno.KvEntry<unknown>[] {
  const results: Deno.KvEntry<unknown>[] = [];
  for (let i = 0; i < numResults; i++) {
    results.push({
      key: ["testKey" + i],
      value: "testValue" + i,
      versionstamp: "testVersionstamp" + i,
    });
  }
  return results;
}
