import { KvUIEntry } from "../types.ts";

export function createKvUIEntry(entry: Deno.KvEntry<unknown>): KvUIEntry {
  const value = typeof entry.value === "string"
    ? entry.value
    : Deno.inspect(entry.value, { strAbbreviateSize: Number.MAX_SAFE_INTEGER });
  const displayValue = value.length > 180 ? value.slice(0, 180) + "..." : value;
  const uiEntry = {
    key: Deno.inspect(entry.key, { strAbbreviateSize: Number.MAX_SAFE_INTEGER }),
    value: displayValue,
    versionstamp: entry.versionstamp,
    fullValue: value,
  };
  return uiEntry;
}
