import JSON5 from "https://unpkg.com/json5@2.2.3/dist/index.min.mjs";

type SupportedSerializableTypes =
  | string
  | number
  | boolean
  | null
  | undefined //partial support
  | bigint
  | RegExp
  | Date
  | Deno.KvU64
  | Uint8Array
  | Map<unknown, unknown>
  | Set<unknown>
  | symbol;

interface KvType {
  type: SupportedSerializableTypes;
  value: unknown;
}

/* Convert to string */
function replacer(_key: unknown, value: unknown) {
  if (value instanceof Map) {
    return {
      type: "Map",
      value: Array.from(value.entries()),
    };
  } else if (value instanceof Set) {
    return {
      type: "Set",
      value: Array.from(value.keys()),
    };
  } else if (typeof value === "bigint") {
    return String(value) + "n";
  } else if (typeof value === "undefined") {
    /**
     * 'undefined' does not serialize/deserialize properly.
     * 
     * JSON.parse() is unable to add a property set to undefined.  Instead a property
     * set to undefined in the reviver function will not be added to the object.  This is
     * unfortunate because it means that the property will be lost when the object is
     * serialized and then deserialized. To prevent unexpected behavior, remove the property
     * from the serialized string to make it explicit that the property won't appear in an
     * edited entry.
     *
     * For example:
     * BEFORE JSON5 serialize/deserialize:  { a: 1, b: undefined, c: 3 }
     * AFTER JSON5 serialize/deserialize:   { a: 1, c: 3 }
     */
    return { type: "undefined", value: "undefined" };
  } else if (value instanceof RegExp) {
    return { type: "RegExp", value: value.toString() };
  } else if (value instanceof Deno.KvU64) {
    return { type: "KvU64", value: String(value) };
  } else if (value instanceof Uint8Array) {
    return { type: "Uint8Array", value: Array.from(value) };
  } else if (typeof value === "symbol") {
    return { type: "Symbol", value: value.toString() };
  } else if (typeof value === "string" && value.startsWith("'__Date__")) {
    return { type: "Date", value: value.slice("'__Date__".length, -1) };
  } else {
    return value;
  }
}

/* Restore to original type from string */
function reviver(_key: unknown, value: unknown) {
  if (typeof value === "object" && isKvType(value)) {
    if (value.type === "Map") {
      if (Array.isArray(value.value)) {
        return new Map(value.value);
      } else {
        throw new Error("Invalid Map value");
      }
    } else if (value.type === "Set") {
      if (Array.isArray(value.value)) {
        return new Set(value.value);
      } else {
        throw new Error("Invalid Set value");
      }
    } else if (value.type === "bigint" && typeof value.value === "string") {
      return BigInt(value.value);
    } else if (value.type === "undefined") {
      return undefined;
    } else if (value.type === "RegExp" && typeof value.value === "string") {
      const re = value.value;
      const match = re.match(/^\/(.*)\/([gimuy]*)$/);
      if (match) {
        return new RegExp(match[1], match[2]);
      } else {
        throw new Error("Invalid RegExp");
      }
    } else if (value.type === "Uint8Array" && Array.isArray(value.value)) {
      // TODO: add validity check for value array contents
      return new Uint8Array(value.value);
    } else if (value.type === "KvU64" && typeof value.value === "string") {
      return new Deno.KvU64(BigInt(value.value));
    } else if (value.type === "Symbol" && typeof value.value === "string") {
      return Symbol(value.value.slice("Symbol(".length, -1));
    } else if (value.type === "Date" && typeof value.value === "string") {
      return new Date(value.value);
    }
  } else if (typeof value === "string" && /^-?\d+n$/.test(value)) {
    return BigInt(value.slice(0, -1));
  }
  return value;
}

/**
 * Dear Ecma Standard authors, please look the other way :)
 *
 * This is a hack to make Date objects deserialize from JSON5 strings.  By default, Date objects
 * are serialized to a string prior to JSON5 serialization.  This is a problem because the
 * stringified Date object is now indistinguishable from a string that happens to be a valid
 * ISO date string.  This hack prefixes the stringified Date object with "__Date__" so that
 * it can be distinguished from a string on revival and transformed back into a Date.
 */
Date.prototype.toJSON = function () {
  return JSON5.stringify("__Date__" + this.toISOString());
};

/**
 * Convert an object to a JSON5 string, with enhanced support for:
 * - Map
 * - Set
 * - bigint
 * - RegExp
 * - Uint8Array
 * - Deno.KvU64
 * - Date
 * - null
 *
 * Standard support exists of course for:
 * - string, number, boolean, arrays and objects
 *
 * undefined values are stringified to "undefined", however be aware that their
 * deserialization does not work and properties with undefined values are removed.
 *
 * circular references are not supported and will throw
 *
 * @param input
 * @returns Customer JSON5 string representation of the input, pretty printed with 2 spaces
 */
export function json5Stringify(input: unknown, flat?: boolean): string {
  const json5 = JSON5.stringify(input, {
    replacer: replacer,
    quote: '"',
    space: flat ? undefined : 2,
  });

  // If this contains a Uint8Array, flatten the string to avoid excessive newlines
  const uint8arrayRegex = /(type: \"Uint8Array\",\s*value: \[)([\d,\s]*)(\s*\])/g;
  const flattened = json5.replace(
    uint8arrayRegex,
    (_match: string, g1: string, g2: string, g3: string) => {
      return `${g1}${g2.replace(/\s/g, "")}${g3}`;
    },
  );
  return flattened;
}

/**
 * Convert a custom JSON5 string (generated via json5Stringify) to an object.  Supports:
 * - Map
 * - Set
 * - bigint
 * - RegExp
 * - Uint8Array
 * - Deno.KvU64
 * - Date
 * - null
 * - string, number, boolean, arrays and objects
 *
 * undefined values are stringified to "undefined", however be aware that their
 * deserialization does not work and properties with undefined values are removed.
 *
 * @param str
 * @returns reconstructed object or value
 */
export function json5Parse(str: string): unknown {
  return JSON5.parse(str, reviver);
}

const supportedTypes: SupportedSerializableTypes[] = [
  "Date",
  "bigint",
  "Map",
  "Set",
  "RegExp",
  "Uint8Array",
  "KvU64",
  "undefined",
];

function isKvType(obj: unknown): obj is KvType {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    supportedTypes.includes((obj as KvType).type) &&
    "value" in obj
  );
}

export function asString(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "bigint") return String(value) + "n";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "function") return value.toString();
  if (value instanceof Map) return json5Stringify(Array.from(value.entries()));
  if (value instanceof Set) return json5Stringify(Array.from(value.keys()));
  if (value instanceof RegExp) return value.toString();
  if (value instanceof Uint8Array) return json5Stringify(Array.from(value));
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Deno.KvU64) return String(value) + "n";

  return json5Stringify(value);
}

export function keyAsString(key: Deno.KvKey): string {
  const parts: string[] = [];
  for (const part of key) {
    if (typeof part === "string") parts.push(quotedString(part));
    else if (part instanceof Uint8Array) parts.push("[" + Array.from(part) + "]");
    else parts.push(asString(part));
  }
  return "[" + parts.join(", ") + "]";
}

function quotedString(value: string): string {
  const hasDoubleQuote = value.includes('"');
  const hasSingleQuote = value.includes("'");
  const hasBacktick = value.includes("`");
  switch (true) {
    case hasDoubleQuote && !hasSingleQuote && !hasBacktick:
      return `'${value}'`;

    case !hasDoubleQuote && hasSingleQuote && !hasBacktick:
    case !hasDoubleQuote && !hasSingleQuote && hasBacktick:
      return `"${value}"`;

    default:
      return `"${value.replace(/"/g, '\\"')}"`;
  }
}
