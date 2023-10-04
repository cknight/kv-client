import { KvEntry, KvSearchOptions } from "../types.ts";
import { parseKvKey } from "./kvKeyParser.ts";
import { ValidationError } from "./validationError.ts";

export async function searchKv(
  searchOptions: KvSearchOptions,
): Promise<KvEntry[]> {
  const { kv, prefix, start, end, limit, reverse } = searchOptions;

  const prefixKey = parseKvKey(prefix);
  const startKey = parseKvKey(start);
  const endKey = parseKvKey(end);
  const maxEntries = limit === "" ? 10 : parseInt(limit);

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
  console.log("KV List Selector: ", selector);

  const options = { limit: maxEntries, reverse, batchSize: maxEntries };
  const listIterator = kv.list(selector, options);
  let count = 0;
  const results: KvEntry[] = [];

  for await (const entry of listIterator) {
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
  }
  console.log("Found ", results.length, " results");
  return results;
}
