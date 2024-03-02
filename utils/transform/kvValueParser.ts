import { SupportedValueTypes } from "../../types.ts";
import { ValidationError } from "../errors.ts";
import { json5Parse } from "./stringSerialization.ts";

export function buildKvValue(valueInput: string, valueType: SupportedValueTypes): unknown {
  const value = valueInput.trim();
  switch (valueType) {
    case "bigint": {
      try {
        if (value.endsWith("n")) {
          return BigInt(value.slice(0, -1));
        }
        return BigInt(value);
      } catch (_e) {
        throw new ValidationError(`Value is not a bigint`);
      }
    }
    case "boolean": {
      if (value === "true") return true;
      if (value === "false") return false;
      throw new ValidationError(`Value is not true or false`);
    }
    case "null": {
      if (value === "null") return null;
      throw new ValidationError(`Value is not null`);
    }
    case "number": {
      const num = Number(value);
      if (isNaN(num)) throw new ValidationError(`Value is not a number`);
      return num;
    }
    case "string": {
      return value;
    }
    case "JSON": {
      try {
        JSON.parse(value); //validate value parses as JSON
      } catch (e) {
        throw new ValidationError("Invalid JSON: " + e.message);
      }
      return value;
    }
    case "Array":
    case "Map":
    case "Set":
    case "object": {
      if (value === "") throw new ValidationError(`Value is not a ${valueType}`);
      let typedValue = value;
      if (valueType === "Map" || valueType === "Set") {
        typedValue = `{ type: "${valueType}", value: ${value} }`;
      }
      try {
        const result = json5Parse(typedValue) as object | Array<unknown>;
        if (notType(result, valueType)) {
          throw new ValidationError(`Value is not a ${valueType}`);
        }
        return result;
      } catch (e) {
        throw new ValidationError(`Invalid ${valueType}: ${e.message}`);
      }
    }
    case "Date": {
      if (
        /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/
          .test(value)
      ) {
        return new Date(value);
      } else {
        try {
          const parsedDate = json5Parse(value) as Date;
          if (notType(parsedDate, "Date") || isNaN(parsedDate.getTime())) {
            throw new ValidationError(`Value is not a valid Date`);
          }
          return parsedDate;
        } catch (_e) {
          throw new ValidationError(`Value is not a valid Date`);
        }
      }
    }
    case "KvU64": {
      try {
        if (/^(0|[1-9]\d*)$/.test(value)) {
          return new Deno.KvU64(BigInt(value));
        } else if (/^(0|[1-9]\d*)n$/.test(value)) {
          return new Deno.KvU64(BigInt(value.slice(0, -1)));
        } else {
          const parsedKvU64 = json5Parse(value) as Deno.KvU64;
          if (notType(parsedKvU64, "KvU64")) {
            throw new ValidationError(`Value is not a valid KvU64`);
          }
          return parsedKvU64;
        }
      } catch (e) {
        throw new ValidationError("Invalid KvU64: " + e.message);
      }
    }
    case "RegExp": {
      if (/^\s*\{\s*type:\s*"RegExp"\s*,\s*value:/.test(value)) {
        //e.g. { type: "RegExp", value: "/abc/g"}
        try {
          const parsedRegExp = json5Parse(value) as RegExp;
          if (notType(parsedRegExp, "RegExp")) {
            throw new ValidationError(`Value is not a valid RegExp`);
          }
          return parsedRegExp;
        } catch (e) {
          throw new ValidationError(e.message);
        }
      }

      try {
        //e.g. /abc/g
        const matches = value.match(/\/(.*)\/(.*)/);
        if (matches) {
          return new RegExp(matches[1], matches[2]);
        }
        throw new ValidationError(`Value is not a valid RegExp`);
      } catch (e) {
        throw new ValidationError("Invalid RegExp: " + e.message);
      }
    }
    case "Uint8Array": {
      try {
        const parsedUint8Array = json5Parse(value) as Uint8Array | Array<number>;

        //Sorry
        const isUint8Array = !notType(parsedUint8Array, "Uint8Array");
        const isArray = !notType(parsedUint8Array, "Array");

        if (isUint8Array) {
          return parsedUint8Array;
        } else if (isArray) {
          const isValid = parsedUint8Array.every((item) =>
            typeof item === "number" && item >= 0 && item <= 255
          );
          if (isValid) {
            return new Uint8Array(parsedUint8Array);
          } else {
            throw new ValidationError(`Value is not a valid Uint8Array`);
          }
        }
        throw new ValidationError(`Value is not a valid Uint8Array`);
      } catch (e) {
        throw new ValidationError("Invalid Uint8Array: " + e.message);
      }
    }
  }
}

function notType(value: unknown, expectedType: string): boolean {
  if (
    typeof value === "object" && value != null && value.constructor &&
    (value.constructor.name === expectedType ||
      value.constructor.name === "Object" && expectedType === "object")
  ) {
    return false;
  }
  return true;
}
