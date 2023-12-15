import { KvListOptions, ListAuditLog, OpStats, PartialListResults, State } from "../../types.ts";
import { establishKvConnection } from "./kvConnect.ts";
import { parseKvKey } from "../transform/kvKeyParser.ts";
import { getUserState } from "../state/state.ts";
import { ValidationError } from "../errors.ts";
import { computeSize } from "./kvUnitsConsumed.ts";
import { readUnitsConsumed } from "./kvUnitsConsumed.ts";
import { auditAction, auditConnectionName } from "./kvAudit.ts";
import { executorId } from "../connections/denoDeploy/deployUser.ts";
import { toJSON } from "../utils.ts";

export async function listKv(
  listOptions: KvListOptions,
): Promise<PartialListResults> {
  const startTime = Date.now();
  const { session, connectionId, prefix, start, end, limit, reverse, disableCache } = listOptions;
  const state = getUserState(session);
  const cachedListResults = !disableCache &&
    state.cache.get({ connectionId, prefix, start, end, reverse });
  const cachedResults: Deno.KvEntry<unknown>[] = [];

  let cursor: string | undefined = undefined;
  let maxEntries = limit === "all" ? Number.MAX_SAFE_INTEGER : parseInt(limit);

  if (cachedListResults) {
    const cachedData = cachedListResults.dataRetrieved.slice(0, maxEntries);
    console.debug(
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

    if (!cachedListResults.cursor) {
      // All data has already been retrieved, so return whatever we have
      console.debug("All data already retrieved from cache");
      return {
        results: cachedData,
        cursor: cachedListResults.cursor,
        opStats: cacheStats,
      };
    } else if (cachedData.length === maxEntries) {
      // We don't have all data, but we do have exactly the data requested, so return it
      console.debug("All data requested already in cache");
      return {
        results: cachedData,
        cursor: cachedListResults.cursor,
        opStats: cacheStats,
      };
    } else {
      // We don't have all the data, so fetch more using the cursor
      cursor = cachedListResults.cursor;
      cachedResults.push(...cachedData);
      maxEntries -= cachedData.length;
    }
  }

  const prefixKey = parseKvKey(prefix);
  const startKey = parseKvKey(start);
  const endKey = parseKvKey(end);

  await establishKvConnection(session, connectionId);
  validateInputs(state, prefix, start, end);

  const selector = createListSelector(startKey, endKey, prefixKey);
  const options = {
    limit: maxEntries,
    reverse,
    cursor,
    batchSize: maxEntries > 500 ? 500 : maxEntries,
  };
  const listIterator = state.kv!.list(selector, options);
  console.debug("kv.list(" + toJSON(selector) + ", " + JSON.stringify(options) + ")");
  let count = 0;
  let operationSize = 0;
  let newCursor: string | false = "";
  const newResults: Deno.KvEntry<unknown>[] = [];

  const queryOnlyTimeStart = Date.now();
  let result = await listIterator.next();
  while (!result.done) {
    newCursor = listIterator.cursor;
    const entry = result.value;
    newResults.push(entry);
    operationSize += computeSize(entry.key, entry.value);

    if (++count === maxEntries) {
      break;
    } else if (count % 100000 === 0) {
      console.debug("Retrieved", count, "results");
    }
    result = await listIterator.next();
  }
  const queryOnlyTime = Date.now() - queryOnlyTimeStart;
  newCursor = listIterator.cursor === "" ? false : newCursor;

  /**
   * Caching is always used if the user edits, deletes or copies a key(s) as the results from
   * the cache are used to determine which keys to operate on.  However, if the cache is disabled
   * by the user then any results from this list op are set in the cache (overwriting any previously)
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
    console.debug("Caching", newResults.length, "results.  Cursor", newCursor);
    state.cache.add({
      connectionId,
      prefix,
      start,
      end,
      reverse,
      results: newResults,
      cursor: newCursor,
    });
  }

  const readUnits = readUnitsConsumed(operationSize);

  const audit: ListAuditLog = {
    auditType: "list",
    executorId: executorId(session),
    prefixKey: prefix,
    startKey: start,
    endKey: end,
    limit,
    reverse,
    results: newResults.length,
    readUnitsConsumed: readUnits,
    connection: auditConnectionName(state.connection!),
    isDeploy: state.connection!.isRemote,
    rtms: queryOnlyTime,
  };
  await auditAction(audit);

  const finalResults = cachedResults.concat(newResults);
  console.debug(
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
  return { results: finalResults, cursor: newCursor, opStats };
}

function createListSelector(
  startKey: Deno.KvKey,
  endKey: Deno.KvKey,
  prefixKey: Deno.KvKey,
) {
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

function validateInputs(
  state: State,
  prefix: string,
  start: string,
  end: string,
) {
  if (!state.kv) {
    throw new ValidationError(
      "Please connect to a KV instance first",
    );
  }

  if (prefix.length > 0 && start.length > 0 && end.length > 0) {
    throw new ValidationError(
      "Cannot specify a prefix, start and end key.  Valid combinations are prefix, prefix/start, prefix/end or start/end",
    );
  }
}
