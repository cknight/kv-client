import { KvListOptions, ListAuditLog, OpStats, PartialListResults } from "../../types.ts";
import { ValidationError } from "../errors.ts";
import { logDebug } from "../log.ts";
import { getUserState, shouldAbort } from "../state/state.ts";
import { parseKvKey } from "../transform/kvKeyParser.ts";
import { executorId } from "../user/denoDeploy/deployUser.ts";
import { toJSON } from "../utils.ts";
import { auditAction, auditConnectionName } from "./kvAudit.ts";
import { establishKvConnection } from "./kvConnect.ts";
import { computeSize, readUnitsConsumed } from "./kvUnitsConsumed.ts";

/**
 * Perform a list operation on a KV instance.  When allowed, the results will be served from a list criteria specific
 * cache rather than the KV instance.  Cache results are held for up to 24 hours and are shared across users of the same connection.
 *
 * @param KvListOptions
 * @returns PartialListResults - matching the supplied list criteria, but not necessarily all matching results.
 */
export async function listKv(
  listOptions: KvListOptions,
): Promise<PartialListResults> {
  const startTime = Date.now();
  const {
    session,
    connectionId,
    prefix,
    start,
    end,
    limit,
    reverse,
    disableCache,
    disableAudit,
    abortId,
  } = listOptions;

  const kv = await establishKvConnection(session, connectionId);

  const state = getUserState(session);
  const cachedListResults = !disableCache &&
    state.cache.get({ connectionId, prefix, start, end, reverse });
  const cachedResults: Deno.KvEntry<unknown>[] = [];

  let cursor: string | undefined = undefined;
  let maxEntries = limit === "all" ? Number.MAX_SAFE_INTEGER : parseInt(limit);

  if (cachedListResults) {
    const cachedData = cachedListResults.dataRetrieved.slice(0, maxEntries);
    logDebug(
      { sessionId: session },
      "Cached data:",
      cachedData.length,
      "Limit:",
      limit === "all" ? "all" : parseInt(limit),
      "More available?",
      cachedListResults.cursor !== false,
    );
    const cacheStats: OpStats = {
      opType: "read",
      unitsConsumed: 0,
      cachedResults: cachedData.length,
      kvResults: 0,
      rtms: Date.now() - startTime,
    };

    if (!cachedListResults.cursor && cachedData.length > 0) {
      // All data has already been retrieved, so return whatever we have
      logDebug({ sessionId: session }, "All data already retrieved from cache");
      return {
        results: cachedData,
        cursor: cachedListResults.cursor,
        opStats: cacheStats,
        aborted: false,
      };
    } else if (cachedData.length === maxEntries) {
      // We don't have all data, but we do have exactly the data requested, so return it
      logDebug({ sessionId: session }, "All data requested already in cache");
      return {
        results: cachedData,
        cursor: cachedListResults.cursor,
        opStats: cacheStats,
        aborted: false,
      };
    } else {
      // We don't have all the data, so fetch more using the cursor
      cursor = cachedListResults.cursor || undefined;
      cachedResults.push(...cachedData);
      maxEntries -= cachedData.length;
    }
  }

  const prefixKey = parseKvKey(prefix);
  const startKey = parseKvKey(start);
  const endKey = parseKvKey(end);

  validateInputs(kv, prefix, start, end);

  const selector = createListSelector(startKey, endKey, prefixKey);
  const options = {
    limit: maxEntries,
    reverse,
    cursor,
    batchSize: maxEntries > 500 ? 500 : maxEntries,
  };
  const listIterator = kv.list(selector, options);
  logDebug(
    { sessionId: session },
    "kv.list(" + toJSON(selector) + ", " + JSON.stringify(options) + ")",
  );
  let count = 0;
  let operationSize = 0;
  let newCursor: string | false = "";
  const newResults: Deno.KvEntry<unknown>[] = [];

  const queryOnlyTimeStart = Date.now();
  let result = await listIterator.next();
  let aborted = false;
  while (!result.done && !aborted) {
    newCursor = listIterator.cursor;
    const entry = result.value;
    newResults.push(entry);
    operationSize += computeSize(entry.key, entry.value);

    if (++count === maxEntries) {
      break;
    } else if (abortId && shouldAbort(abortId)) {
      aborted = true;
      break;
    } else if (count % 100000 === 0) {
      logDebug({ sessionId: session }, "Retrieved", count, "results");
    }
    result = await listIterator.next();
  }
  const queryOnlyTime = Date.now() - queryOnlyTimeStart;
  newCursor = listIterator.cursor === "" ? false : newCursor;

  /**
   * Caching is always used if the user edits, deletes or copies entries as the results from
   * the cache are used to determine which keys to operate on.  However, if the cache is disabled
   * by the user then any results from this list op are set in the cache (overwriting any previously
   * cached data), not added to any existing results already in the cache.
   */
  if (disableCache) {
    state.cache.set({
      connectionId,
      prefix,
      start,
      end,
      reverse,
      results: newResults,
      cursor: newCursor,
    });
  } else {
    logDebug({ sessionId: session }, "Caching", newResults.length, "results.  Cursor", newCursor);
    state.cache.add({
      connectionId,
      prefix,
      start,
      end,
      reverse,
      results: newResults,
      cursor: newCursor,
    }, session);
  }

  const readUnits = readUnitsConsumed(operationSize);

  if (!disableAudit) {
    const audit: ListAuditLog = {
      auditType: "list",
      executorId: await executorId(session),
      prefixKey: prefix,
      startKey: start,
      endKey: end,
      limit,
      reverse,
      results: newResults.length,
      readUnitsConsumed: readUnits,
      connection: auditConnectionName(state.connection!),
      infra: state.connection!.infra,
      rtms: queryOnlyTime,
      aborted,
    };
    await auditAction(audit, session);
  }

  const finalResults = cachedResults.concat(newResults);
  logDebug(
    { sessionId: session },
    "List results:",
    finalResults.length - newResults.length,
    "results from cache,",
    newResults.length,
    "from KV, in",
    Date.now() - startTime,
    "ms of which",
    queryOnlyTime,
    "ms was spent querying KV",
  );

  const opStats: OpStats = {
    opType: "read",
    unitsConsumed: readUnits,
    cachedResults: cachedResults.length,
    kvResults: newResults.length,
    rtms: queryOnlyTime,
  };
  return { results: finalResults, cursor: newCursor, opStats, aborted };
}

/**
 * See https://deno.land/api@v1.41.3?s=Deno.KvListSelector&unstable=
 * @param startKey
 * @param endKey
 * @param prefixKey
 * @returns Deno.KvListSelector
 */
function createListSelector(
  startKey: Deno.KvKey,
  endKey: Deno.KvKey,
  prefixKey: Deno.KvKey,
): Deno.KvListSelector {
  let selector: Deno.KvListSelector;
  if (startKey.length > 0 && endKey.length > 0) {
    selector = { start: startKey, end: endKey };
  } else if (startKey.length > 0) {
    selector = { prefix: prefixKey, start: startKey };
  } else if (endKey.length > 0) {
    selector = { prefix: prefixKey, end: endKey };
  } else {
    selector = { prefix: prefixKey };
  }
  return selector;
}

function validateInputs(kv: Deno.Kv, prefix: string, start: string, end: string): void {
  if (prefix.length > 0 && start.length > 0 && end.length > 0) {
    kv.close();
    throw new ValidationError(
      "Cannot specify a prefix, start and end key.",
    );
  }
}
