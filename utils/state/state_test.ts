import { assertEquals } from "$std/assert/assert_equals.ts";
import { assert } from "$std/assert/assert.ts";
import { _internals } from "../kv/kvQueue.ts";
import { abort, deleteAbortId, deleteUserState, getExportStatus, getUserState, shouldAbort, updateExportStatus } from "./state.ts";
import { SESSION_ID, cleanup, createDb } from "../test/testUtils.ts";
import { ExportStatus, KvConnection } from "../../types.ts";

Deno.test("state abort", async () => {
  assert(!shouldAbort("abort"));

  let queueCalled = false;
  _internals.enqueue = async (msg: unknown, delay: number) => {
    assertEquals(msg, {channel: "DeleteAbortId", message: { abortId: "abort"}});
    assertEquals(delay, 1000 * 60 * 10);
    queueCalled = true;
  };
  await abort("abort");
  assertEquals(queueCalled, true);
  
  assert(shouldAbort("abort"));
  deleteAbortId("abort");
  assert(!shouldAbort("abort"));
});

Deno.test("stats export status", async () => {
  const id = "exportId";
  assertEquals(getExportStatus(id), undefined);

  _internals.enqueue = async (msg: unknown, delay: number) => {
    throw new Error("Should not be called");
  };

  const initiatingStatus: ExportStatus = {status: "initiating", keysProcessed: 0, bytesProcessed: 0};
  const inProgress: ExportStatus = {status: "in progress", keysProcessed: 0, bytesProcessed: 0};
  const complete: ExportStatus = {status: "complete", keysProcessed: 0, bytesProcessed: 0};
  const aborted: ExportStatus = {status: "aborted", keysProcessed: 0, bytesProcessed: 0};
  const failed: ExportStatus = {status: "failed", keysProcessed: 0, bytesProcessed: 0};
  await updateExportStatus(id, initiatingStatus, SESSION_ID);
  assertEquals(getExportStatus(id), initiatingStatus);

  await updateExportStatus(id, inProgress, SESSION_ID);
  assertEquals(getExportStatus(id), inProgress);

  let queueCalled = false;
  _internals.enqueue = async (msg: unknown, delay: number) => {
    assertEquals(msg, {channel: "DeleteStatus", message: { exportId: id}});
    assertEquals(delay, 1000 * 60 * 10);
    queueCalled = true;
  };
  await updateExportStatus(id, complete, SESSION_ID);
  assertEquals(getExportStatus(id), complete);
  assertEquals(queueCalled, true);

  queueCalled = false;
  await updateExportStatus(id, aborted, SESSION_ID);
  assertEquals(getExportStatus(id), aborted);
  assertEquals(queueCalled, true);

  queueCalled = false;
  await updateExportStatus(id, failed, SESSION_ID);
  assertEquals(getExportStatus(id), failed);
  assertEquals(queueCalled, true);
});

Deno.test("state - userState", async () => {
  const kv = await createDb();

  try {
    const state = getUserState(SESSION_ID);
    assertEquals(state.kv, null);
    assertEquals(state.connection, null);
    assertEquals(state.cache.size(), 0);

    state.kv = kv;
    state.connection = {
      name: "test",
      id: "test",
      environment: "local",
    } as KvConnection;
    state.cache.add({
      connectionId: "testConnectionId",
      prefix: "prefix",
      start: "testStart",
      end: "testEnd",
      reverse: false,
      cursor: "testCursor",
      results: [{
        key: ["testKey"],
        value: "testValue",
        versionstamp: "testVersionstamp",
      }],
    }, SESSION_ID);

    const checkState = getUserState(SESSION_ID);
    assertEquals(checkState.kv, kv);
    assertEquals(checkState.connection, state.connection);
    assertEquals(checkState.cache.size(), 1);

    const anotherState = getUserState("anotherSession");
    assertEquals(anotherState.kv, null);
    assertEquals(anotherState.connection, null);
    assertEquals(anotherState.cache.size(), 0);

    deleteUserState(SESSION_ID);
    const deletedState = getUserState(SESSION_ID);
    assertEquals(deletedState.kv, null);
    assertEquals(deletedState.connection, null);
    assertEquals(deletedState.cache.size(), 0);
    deleteUserState("anotherSession");
    deleteUserState("deletedSession");
  } finally {
    await cleanup();
  }
});