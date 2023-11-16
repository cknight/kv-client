import { getUserState } from "../state.ts";
import { hashKvKey, toJSON } from "../utils.ts";

export interface KeyOperationData {
  connectionId: string;
  keysSelected: string[];
  filter?: string;
  prefix: string;
  start: string;
  end: string;
  from: number;
  show: number;
  reverse: boolean;
}

/**
 * Given a set of serialized hashed keys and a set of search criteria, return the keys to operate on. This 
 * will be one of the 3:
 * 1. All Deno.KvEntry in the cache for the search criteria
 * 2. All filtered Deno.KvEntry in the cache for the search criteria
 * 3. The one or more specific Deno.KvEntry in the cache for the search criteria and keys selected
 * 
 * @param data 
 * @param session 
 * @returns list of Deno.KvEntry to operate on
 */
export async function entriesToOperateOn(data: KeyOperationData, session: string): Promise<Deno.KvEntry<unknown>[]> {
  const startTime = Date.now();
  const state = getUserState(session);
  const { connectionId, keysSelected, prefix, start, end, reverse } = data;
  if (!state.connection || connectionId !== state.connection.id) {
    console.error(`Connection ${connectionId} is not active.  Aborting.`);
    throw new Error("Internal error.  Connection not active.  Aborting.");
  }

  //get all results from the cache for the search from which operation was requested
  const cachedSearch = state.cache.get({ connectionId, prefix, start, end, reverse });

  if (!cachedSearch) {
    console.error("Cache entry not found for search criteria from which operation was requested");
    throw new Error("Internal error.  Cache entry not found.  Aborting.");
  }

  /**
   * There are 3 scenarios:
   *
   * Scenario 1: no keys supplied and no filter (operate on all results)
   * Scenario 2: no keys supplied and filter specified (operate on all filtered results)
   * Scenario 3: keys specified (operate on specific keys)
   *
   * keysSelected are sha-512 hashes of serializeDenoKvKey(KvKey)
   */
  let kvEntries: Deno.KvEntry<unknown>[] = [];

  if (keysSelected.length === 0 && (data.filter === undefined || data.filter === "")) {
    // Scenario 1 - Operate on all results
    kvEntries = cachedSearch.dataRetrieved;
    console.debug(
      `Operating on all ${kvEntries.length} key${kvEntries.length > 1 ? "s" : ""}`,
    );
  } else {
    const { resultsPage, resultsWorkingSet } = buildResultsPage(
      data.filter,
      cachedSearch.dataRetrieved,
      data.from,
      data.show,
    );
    if (keysSelected.length === 0) {
      // Scenario 2 - Operate on all filtered results
      kvEntries = resultsWorkingSet;
      console.debug(
        `Operating on all ${kvEntries.length} filtered keys${kvEntries.length > 1 ? "s" : ""}`,
      );
    } else {
      // Scenario 3 - Operate on specific keys
      for (const result of resultsPage) {
        if (keysSelected.includes(await hashKvKey(result.key))) {
          kvEntries.push(result);
        }
      }

      if (kvEntries.length !== keysSelected.length) {
        console.error("Mismatch between keys to operate on and keys retrieved from cache.  Aborting.");
        throw new Error(
          "Internal error.  Mismatch between keys to operate on and keys retrieved from cache.  Aborting.",
        );
      }

      console.debug(
        `Operating on ${kvEntries.length} key${data.keysSelected.length > 1 ? "s" : ""}`,
      );
    }
  }

  console.log("  Time to match keys:", Date.now() - startTime, "ms");
  return kvEntries;
}

export function buildResultsPage(filter: string | undefined, results: Deno.KvEntry<unknown>[], from: number, show: number) {
  let filtered = false;
  let resultsWorkingSet = results;
  if (filter !== undefined && filter !== "") {
    const startTime = Date.now();
    const matchingFilterResults: Deno.KvEntry<unknown>[] = [];
    for (const entry of results) {
      const stringified = toJSON(entry.key) + toJSON(entry.value);
      if (stringified.includes(filter)) {
        matchingFilterResults.push(entry);
      }
    }

    console.debug(`  Filtering ${results.length} rows took `, Date.now() - startTime, `ms`);
    resultsWorkingSet = matchingFilterResults;
    filtered = true;
  }

  const resultsCount = resultsWorkingSet.length;
  const resultsPage = resultsWorkingSet.slice(from - 1, from - 1 + show);
  return { resultsPage, resultsCount, filtered, resultsWorkingSet};
}