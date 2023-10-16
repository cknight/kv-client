import { KvSearchOptions, PartialSearchResults, State } from "../types.ts";
import { establishKvConnection } from "./kvConnect.ts";
import { parseKvKey } from "./kvKeyParser.ts";
import { getState } from "./state.ts";
import { ValidationError } from "./errors.ts";

export async function searchKv(
  searchOptions: KvSearchOptions,
): Promise<PartialSearchResults> {
  const startTime = Date.now();
  const { session, connection, pat, prefix, start, end, limit, reverse } = searchOptions;
  const state = getState(session);
  const cachedSearch = state.cache.get({ prefix, start, end, reverse });
  const results: Deno.KvEntry<unknown>[] = [];

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
    if (!cachedSearch.cursor) {
      // All data has already been retrieved, so return whatever we have
      return {
        results: cachedData,
        cursor: cachedSearch.cursor,
      };
    } else if (cachedData.length === maxEntries) {
      // We don't have all data, but we do have exactly the data requested, so return it
      return {
        results: cachedData,
        cursor: cachedSearch.cursor,
      };
    } else {
      // We don't have all the data, so fetch more using the cursor
      cursor = cachedSearch.cursor;
      results.push(...cachedData);
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
  console.debug("KV List Selector: ", selector, options);

  const listIterator = state.kv!.list(selector, options);
  let count = 0;

  let newCursor: string | false = "";
  let result = await listIterator.next();
  const newResults: Deno.KvEntry<unknown>[] = [];
  while (!result.done) {
    newCursor = listIterator.cursor;
    const entry = result.value;
    newResults.push(entry);
    results.push(entry);

    if (++count === maxEntries) {
      break;
    }
    result = await listIterator.next();
  }

  newCursor = listIterator.cursor === "" ? false : newCursor;

  //Add results to cache
  state.cache.add({
    prefix,
    start,
    end,
    reverse,
    results: newResults,
    cursor: newCursor,
  });

  console.debug(
    "Search results:",
    results.length - newResults.length,
    "results from cache,",
    newResults.length,
    " from KV, in ",
    Date.now() - startTime,
    "ms",
  );

  return { results, cursor: newCursor };
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
      "Cannot specify a prefix, start and end key.  Valid combinations are prefix, prefix/start, prefix/end, start/end",
    );
  }
}
