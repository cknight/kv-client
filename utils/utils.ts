import { format } from "$std/fmt/bytes.ts";
import { encodeHex } from "$std/encoding/hex.ts";
import { KvUIEntry } from "../types.ts";
import { asString, json5Stringify } from "./transform/stringSerialization.ts";
import { identifyType } from "./transform/typeIdentifier.ts";

const encoder = new TextEncoder();

export async function createKvUIEntry(entry: Deno.KvEntry<unknown>): Promise<KvUIEntry> {
  const value = asString(entry.value);
  const displayValue = value.length > 180 ? value.slice(0, 180) + "..." : value;
  const uiEntry = {
    key: json5Stringify(entry.key),
    value: displayValue,
    versionstamp: entry.versionstamp,
    valueType: identifyType(entry.value),
    fullValue: value,
    keyHash: await hashKvKey(entry.key),
  } satisfies KvUIEntry;
  return uiEntry;
}

export async function hashKvKey(key: Deno.KvKey): Promise<string> {
  // @ts-ignore Use internal Deno API to get access to actual serialization method.
  const DENO_CORE: DenoCore = Deno[Deno.internal].core;
  return await hash(DENO_CORE.serialize(key));
}

async function hash(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-512", bytes);
  const hashHex = encodeHex(new Uint8Array(hashBuffer));
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
 * JSON stringify with custom support for Uint8Array and bigints.  Used
 * for filtering where the key/value pair needs transformed into a string
 * first
 */
export function toJSON(obj: unknown): string {
  return JSON.stringify(obj, replacer, 0);
}

/**
 * @deprecated - not in use and don't plan to use, but here in case needed
 * JSON parse with custom support for Uint8Array and bigints
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
}

// Define Deno Core
type DenoCore = {
  deserialize<T>(data: Uint8Array): T;
  serialize<T>(data: T): Uint8Array;
  decode(data: Uint8Array): string;
  encode(data: string): Uint8Array;
};

// @ts-ignore Use internal Deno API to get access to actual serialization method.
//const DENO_CORE: DenoCore = Deno[Deno.internal].core

/**
 * @returns approximate size of value in bytes
 */
export function approximateSize(value: unknown): number {
  if (value === undefined) return 0;
  //return JSON.stringify(value, bigIntReplacer).length;

  // @ts-ignore Use internal Deno API to get access to actual serialization method.
  const DENO_CORE: DenoCore = Deno[Deno.internal].core;
  return DENO_CORE.serialize(value).length;
}

export function asMaxLengthString(value: string, maxLength: number): string {
  if (value.length > maxLength) {
    return value.substring(0, maxLength - 3) + "...";
  }
  return value;
}
