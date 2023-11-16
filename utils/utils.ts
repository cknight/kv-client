import { format } from "$std/fmt/bytes.ts";
import { encodeHex } from "$std/encoding/hex.ts";
import { KvUIEntry } from "../types.ts";

const encoder = new TextEncoder();

export async function createKvUIEntry(entry: Deno.KvEntry<unknown>): Promise<KvUIEntry> {
  const value = typeof entry.value === "string"
    ? entry.value
    : Deno.inspect(entry.value, { strAbbreviateSize: Number.MAX_SAFE_INTEGER });
  const displayValue = value.length > 180 ? value.slice(0, 180) + "..." : value;
  const uiEntry = {
    key: Deno.inspect(entry.key, { strAbbreviateSize: Number.MAX_SAFE_INTEGER }),
    value: displayValue,
    versionstamp: entry.versionstamp,
    fullValue: value,
    keyHash: await hashKvKey(entry.key),
  };
  return uiEntry;
}

export async function hashKvKey(key: Deno.KvKey): Promise<string> {
  return await hash(serializeDenoKvKey(key));
}

async function hash(keyString:string): Promise<string> {
  const data = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data)
  const hashHex = encodeHex(new Uint8Array(hashBuffer))
  return hashHex;
}


/**
 * @param size in bytes
 * @returns local specific human readable size
 */
export function readableSize(size: number) {
  const locale = navigator.language;
  return locale
    ? format(size, { locale, maximumFractionDigits: 1 })
    : format(size, { maximumFractionDigits: 1 });
}

/**
 * Serialize Deno.KvKey to JSON string with special support for Uint8Array and BigInts
 * @param key 
 * @returns JSON stringified key
 */
export function serializeDenoKvKey(key: Deno.KvKey): string {
  return toJSON(key);
}

/**
 * Deserialize JSON string to Deno.KvKey with special support for Uint8Array and BigInts
 * @param key 
 * @returns Deno.KvKey
 */
export function deserializeDenoKvKey(key: string): Deno.KvKey {
  return fromJSON(key) as Deno.KvKey;
}

/**
 * JSON stringify with custom support for Uint8Array and BigInts
 */
export function toJSON(obj:unknown): string {
  return JSON.stringify(obj, replacer, 0);
}

/**
 * JSON parse with custom support for Uint8Array and BigInts
 */
export function fromJSON(json: string): unknown {
  return JSON.parse(json, reviver);
}

function replacer(_key: string, value: unknown) {
  if (value instanceof Uint8Array) {
    return "__u8__" + value.toString();
  } else if (typeof value === "bigint") {
    return "__bi__" + value.toString();
  }
  return value;
}
function reviver(_key: string, value: unknown) {
  if (typeof value === "string" && value.startsWith("__u8__")) {
    return new Uint8Array(JSON.parse("[" + value.slice(6) + "]"));
  } else if (typeof value === "string" && value.startsWith("__bi__")) {
    return BigInt(value.slice(6));
  }
  return value;
}

function bigIntReplacer(_key: string, value: unknown) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

/**
 * 
 * @returns approximate size of value in bytes
 */
export function approximateSize(value: unknown): number {
  if (value === undefined) return 0;
  return JSON.stringify(value, bigIntReplacer).length;
}