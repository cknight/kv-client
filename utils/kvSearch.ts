import {
  KvConnection,
  KvSearchOptions,
  ListAuditLog,
  OpStats,
  PartialSearchResults,
  State,
} from "../types.ts";
import { establishKvConnection } from "./kvConnect.ts";
import { parseKvKey } from "./kvKeyParser.ts";
import { getUserState } from "./state.ts";
import { ValidationError } from "./errors.ts";
import { computeSize } from "./kvUnitsConsumed.ts";
import { readUnitsConsumed } from "./kvUnitsConsumed.ts";
import { auditListAction } from "./kvAudit.ts";

export async function searchKv(
  searchOptions: KvSearchOptions,
): Promise<PartialSearchResults> {
  const startTime = Date.now();
  const { session, connection, pat, prefix, start, end, limit, reverse } = searchOptions;
  const state = getUserState(session);
  const cachedSearch = state.cache.get({ connection, prefix, start, end, reverse });
  const cachedResults: Deno.KvEntry<unknown>[] = [];

  let cursor: string | undefined = undefined;
  let maxEntries = limit === "all" ? Number.MAX_SAFE_INTEGER : parseInt(limit);

  if (cachedSearch) {
    const cachedData = cachedSearch.dataRetrieved.slice(0, maxEntries);
    console.debug(
      "Cached data:",
      cachedData.length,
      "Expected:",
      limit === "all" ? "all" : parseInt(limit),
      "More available?",
      cachedSearch.cursor !== false,
    );
    const cacheStats: OpStats = {
      opType: "read",
      unitsConsumed: 0,
      cachedResults: cachedData.length,
      kvResults: 0,
      rtms: Date.now() - startTime,
    };

    if (!cachedSearch.cursor) {
      // All data has already been retrieved, so return whatever we have
      console.debug("All data already retrieved from cache");
      return {
        results: cachedData,
        cursor: cachedSearch.cursor,
        opStats: cacheStats,
      };
    } else if (cachedData.length === maxEntries) {
      // We don't have all data, but we do have exactly the data requested, so return it
      console.debug("All data requested already in cache");
      return {
        results: cachedData,
        cursor: cachedSearch.cursor,
        opStats: cacheStats,
      };
    } else {
      // We don't have all the data, so fetch more using the cursor
      cursor = cachedSearch.cursor;
      cachedResults.push(...cachedData);
      maxEntries -= cachedData.length;
    }
  }

  const prefixKey = parseKvKey(prefix);
  const startKey = parseKvKey(start);
  const endKey = parseKvKey(end);

  await establishKvConnection(session, connection, pat);
  validateInputs(state, prefix, start, end);

  const selector = createListSelector(startKey, endKey, prefixKey);
  const options = {
    limit: maxEntries,
    reverse,
    cursor,
    batchSize: maxEntries > 500 ? 500 : maxEntries,
  };
  const listIterator = state.kv!.list(selector, options);
  console.debug("kv.list(" + JSON.stringify(selector) + ", " + JSON.stringify(options) + ")");
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
    }
    result = await listIterator.next();
  }
  const queryOnlyTime = Date.now() - queryOnlyTimeStart;
  newCursor = listIterator.cursor === "" ? false : newCursor;

  //Add results to cache
  state.cache.add({
    connection,
    prefix,
    start,
    end,
    reverse,
    results: newResults,
    cursor: newCursor,
  });

  const readUnits = readUnitsConsumed(operationSize);

  const audit: ListAuditLog = {
    auditType: "list",
    executorId: session,
    prefixKey: prefix,
    startKey: start,
    endKey: end,
    limit,
    reverse,
    results: newResults.length,
    readUnitsConsumed: readUnits,
    connection: state.connection!.id,
    isDeploy: state.connectionIsDeploy,
    rtms: queryOnlyTime,
  };
  await auditListAction(audit);

  const finalResults = cachedResults.concat(newResults);
  console.debug(
    "Search results:",
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
