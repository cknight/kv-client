import { KvUIEntry } from "../types.ts";

export function createKvUIEntry(entry: Deno.KvEntry<unknown>): KvUIEntry {
  const value = typeof entry.value === "string"
    ? entry.value
    : JSON.stringify(entry.value);
  const displayValue = value.length > 180 ? value.slice(0, 180) + "..." : value;
  return {
    key: JSON.stringify(entry.key),
    value: displayValue,
    versionstamp: entry.versionstamp,
    fullValue: value,
  };
}
