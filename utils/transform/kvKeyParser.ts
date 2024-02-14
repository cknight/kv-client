import { UINT8_REGEX } from "../../consts.ts";
import { ValidationError } from "../errors.ts";

const LOG_ENABLED = true;

export function parseKvKey(input: string): Deno.KvKey {
  if (input === "") return [];
  const key: Deno.KvKeyPart[] = [];

  let partialKey: string[] = [];
  let endBlockChar = "";
  let inString = false;
  let inUint8Array = false;

  const parts = input.trim().split(",");
  LOG_ENABLED && console.log("Parts:", parts);
  parts.forEach((part) => {
    LOG_ENABLED && console.log("Processing part:", part);

    if (part.length === 0 && !inString) {
      throw new ValidationError("Invalid key format: " + input);
    }
    const workingString = inString ? part : part.trimStart();
    if (isStringChar(workingString[0]) || inString) {
      // start of new string or middle of previous string
      if (endBlockChar === "" && !inString) {
        // start of new string
        if (
          workingString[workingString.length - 1] === workingString[0] &&
          workingString[workingString.length - 2] !== `\\`
        ) {
          // simple complete string
          LOG_ENABLED && console.log("End of string, processing:", workingString);
          processPart(workingString, key);
          inString = false;
        } else {
          // start of complex string
          endBlockChar = workingString[0];
          partialKey.push(workingString);
          inString = true;
        }
      } else {
        partialKey.push(",");
        // middle of previous string
        if (
          workingString[workingString.length - 1] === endBlockChar &&
          workingString[workingString.length - 2] !== `\\`
        ) {
          // end of complex string
          endBlockChar = "";
          partialKey.push(workingString);
          LOG_ENABLED && console.log("End of string, processing:", partialKey.join(""));
          processPart(partialKey.join(""), key);
          partialKey = [];
          inString = false;
        } else {
          // middle of complex string
          partialKey.push(workingString);
        }
      }
    } else {
      const trimmedPart = part.trim();
      if (trimmedPart[0] === "[") {
        LOG_ENABLED && console.log("Start of unit8 array, processing:", trimmedPart);
        // start of unit8 array
        if (trimmedPart[trimmedPart.length - 1] === "]") {
          // empty or single value unit8 array
          LOG_ENABLED && console.log("End of unit8 array, processing:", trimmedPart);
          processPart(trimmedPart, key);
        } else {
          // start of non-empty unit8 array
          inUint8Array = true;
          partialKey.push(trimmedPart);
        }
      } else if (inUint8Array) {
        if (trimmedPart[trimmedPart.length - 1] === "]") {
          // end of unit8 array
          inUint8Array = false;
          partialKey.push("," + trimmedPart);
          LOG_ENABLED && console.log("End of unit8 array, processing:", partialKey.join(""));
          processPart(partialKey.join(""), key);
          partialKey = [];
        } else {
          // middle of unit8 array
          partialKey.push("," + trimmedPart);
        }
      } else {
        // some other simple type
        LOG_ENABLED && console.log("End of simple type, processing:", trimmedPart);
        processPart(trimmedPart, key);
      }
    }
  });

  if (partialKey.length > 0) {
    throw new ValidationError("Invalid key format: " + input);
  }

  return key;
}

function isStringChar(char: string) {
  return char === '"' || char === "'" || char === "`";
}

function processPart(keyPartInput: string, key: Deno.KvKeyPart[]) {
  const keyPart = keyPartInput.trim();
  if (
    (keyPart.startsWith("'") && keyPart.endsWith("'")) ||
    (keyPart.startsWith("`") && keyPart.endsWith("`")) ||
    (keyPart.startsWith('"') && keyPart.endsWith('"'))
  ) {
    // string type
    LOG_ENABLED && console.log("Pushing string (before slice):", keyPart, keyPart.length);
    key.push(keyPart.slice(1, -1));
    LOG_ENABLED && console.log("Pushing string (after slice):", key);
  } else if (keyPart === "true" || keyPart === "false") {
    // boolean type
    key.push(keyPart === "true");
  } else if (/^-?\d+n$/.test(keyPart)) {
    // bigint type
    key.push(BigInt(keyPart.slice(0, -1)));
  } else if (/^-?\d+(\.\d+)?$/.test(keyPart)) {
    // number type
    key.push(Number(keyPart));
  } else if (keyPart.startsWith("[") && keyPart.endsWith("]")) {
    if (UINT8_REGEX.test(keyPart.replaceAll(" ", ""))) {
      // unit8 array type
      key.push(new Uint8Array(JSON.parse(keyPart)));
    } else {
      console.error("Invalid Unit8Array: " + keyPart);
      throw new ValidationError("Invalid Unit8Array: " + keyPart);
    }
  } else {
    console.error("Invalid key part: " + keyPart);
    throw new ValidationError("Invalid key part: " + keyPart);
  }
}
