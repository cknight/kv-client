import { assertEquals } from "$std/assert/assert_equals.ts";
import { assert } from "$std/assert/assert.ts";
import { env } from "../consts.ts";
import { _internals } from "./kv/kvQueue.ts";
import { logDebug, logError, logInfo, logWarn } from "./log.ts";
import { initializeLogging } from "./log.ts";
import { assertThrows } from "$std/assert/assert_throws.ts";

const SESSION_ID = "session_1234";

Deno.test("log - no log level set defaults to info", async () => {
  _internals.enqueue = async (_msg: unknown, _delay: number) => {};
  const logs = stubConsoleLogging();
  Deno.env.delete(env.LOG_LEVEL);
  initializeLogging();
  logMessages();
  assertEquals(logs.debug, []);
  assert(logs.info[0].endsWith("[session_1234][Anonymous]  info message"));
  assert(logs.warn[0].endsWith("[session_1234][Anonymous]  warn message"));
  assert(logs.error[0].endsWith("[session_1234][Anonymous]  error message"));
});

Deno.test("log - debug level logs all", async () => {
  _internals.enqueue = async (_msg: unknown, _delay: number) => {};
  const logs = stubConsoleLogging();
  Deno.env.set(env.LOG_LEVEL, "DEBUG");
  initializeLogging();
  logMessages();
  assert(logs.debug[0].endsWith("[session_1234][Anonymous]  debug message"));
  assert(logs.info[0].endsWith("[session_1234][Anonymous]  info message"));
  assert(logs.warn[0].endsWith("[session_1234][Anonymous]  warn message"));
  assert(logs.error[0].endsWith("[session_1234][Anonymous]  error message"));
});

Deno.test("log - info level logs info, warn, error", async () => {
  _internals.enqueue = async (_msg: unknown, _delay: number) => {};
  const logs = stubConsoleLogging();
  Deno.env.set(env.LOG_LEVEL, "INFO");
  initializeLogging();
  logMessages();
  assertEquals(logs.debug, []);
  assert(logs.info[0].endsWith("[session_1234][Anonymous]  info message"));
  assert(logs.warn[0].endsWith("[session_1234][Anonymous]  warn message"));
  assert(logs.error[0].endsWith("[session_1234][Anonymous]  error message"));
});

Deno.test("log - warn level logs warn, error", async () => {
  _internals.enqueue = async (_msg: unknown, _delay: number) => {};
  const logs = stubConsoleLogging();
  Deno.env.set(env.LOG_LEVEL, "WARN");
  initializeLogging();
  logMessages();
  assertEquals(logs.debug, []);
  assertEquals(logs.info, []);
  assert(logs.warn[0].endsWith("[session_1234][Anonymous]  warn message"));
  assert(logs.error[0].endsWith("[session_1234][Anonymous]  error message"));
});

Deno.test("log - error level logs error", async () => {
  _internals.enqueue = async (_msg: unknown, _delay: number) => {};
  const logs = stubConsoleLogging();
  Deno.env.set(env.LOG_LEVEL, "ERROR");
  initializeLogging();
  logMessages();
  assertEquals(logs.debug, []);
  assertEquals(logs.info, []);
  assertEquals(logs.warn, []);
  assert(logs.error[0].endsWith("[session_1234][Anonymous]  error message"));
});

Deno.test("log - invalid log level throws error", () => {
  Deno.env.set(env.LOG_LEVEL, "INVALID");
  assertThrows(() => initializeLogging(), Error, "Invalid LOG_LEVEL: INVALID. Allowed values are: DEBUG, INFO, WARN, ERROR");
});

function logMessages() {
  logDebug({sessionId: SESSION_ID}, "debug message");
  logInfo({sessionId: SESSION_ID}, "info message");
  logWarn({sessionId: SESSION_ID}, "warn message");
  logError({sessionId: SESSION_ID}, "error message");

}
function stubConsoleLogging() {
   const recordedLogs = {
    error: [] as string[],
    warn: [] as string[],
    info: [] as string[],
    debug: [] as string[],
   };
  console.error = (...msg:string[]) => { recordedLogs.error.push(msg.join(" "))};
  console.warn = (...msg:string[]) => {recordedLogs.warn.push(msg.join(" "))};
  console.info = (...msg:string[]) => {recordedLogs.info.push(msg.join(" "))};
  console.debug = (...msg:string[]) => {recordedLogs.debug.push(msg.join(" "))};
  return recordedLogs;
}