import { KvSearchOptions, KvUIEntry } from "../types.ts";
import { parseKvKey } from "./kvKeyParser.ts";
import { getState } from "./state.ts";
import { ValidationError } from "./validationError.ts";

export async function searchKv(
  searchOptions: KvSearchOptions,
): Promise<KvUIEntry[]> {
  const { session, prefix, start, end, limit, reverse, cursor } = searchOptions;
  const state = getState(session);

  if (!state.kv) {
    throw new ValidationError(
      "Please connect to a KV instance first",
    );
  }

  const prefixKey = parseKvKey(prefix);
  const startKey = parseKvKey(start);
  const endKey = parseKvKey(end);
  const maxEntries = limit === "all" ? Number.MAX_SAFE_INTEGER : parseInt(limit);

  if (prefix.length > 0 && start.length > 0 && end.length > 0) {
    throw new ValidationError(
      "Cannot specify a prefix, start and end key.  Valid combinations are prefix, prefix/start, prefix/end, start/end",
    );
  }

  let selector: Deno.KvListSelector;
  if (start.length > 0 && end.length > 0) {
    selector = { start: startKey, end: endKey };
  } else if (start.length > 0) {
    selector = { prefix: prefixKey, start: startKey };
  } else if (end.length > 0) {
    selector = { prefix: prefixKey, end: endKey };
  } else {
    selector = { prefix: prefixKey };
  }
  const options = { limit: maxEntries, reverse, cursor, batchSize: maxEntries > 500 ? 500 : maxEntries };
  console.log("KV List Selector: ", selector, options);

  const listIterator = state.kv!.list(selector, options);
  let count = 0;
  const results: KvUIEntry[] = [];

  let newCursor = "";
  let result = await listIterator.next();
  while (!result.done) {
    newCursor = listIterator.cursor;
    const entry = result.value;
//  for await (const entry of listIterator) {
    const value = typeof entry.value === "string"
      ? entry.value
      : JSON.stringify(entry.value);
    const displayValue = value.length > 180
      ? value.slice(0, 180) + "..."
      : value;
    results.push({
      key: JSON.stringify(entry.key),
      value: displayValue,
      versionstamp: entry.versionstamp,
      fullValue: value,
    });

    if (++count > maxEntries) {
      break;
    }
    result = await listIterator.next();
  }

  //Add results to cache
  

  console.log("Found ", results.length, " results");
  return results;
}
