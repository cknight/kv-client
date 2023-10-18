import { ValidationError } from "./errors.ts";

const UINT8_REGEX =
  /^\[(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)(?:,(?:25[0-5]|2[0-4]\d1\d{2}|[1-9]\d|\d))*\]$/;
const LOG_ENABLED = false;

export function parseKvKey(input: string): Deno.KvKey {
  if (input === "") return [];

  const key: Deno.KvKeyPart[] = [];

  let partialKey: string[] = [];
  let endBlockChar = '';
  LOG_ENABLED && console.log("--------------Parsing input:", input);
  for (let i=0; i < input.length; i++) {
    const char = input[i];
    LOG_ENABLED && console.log("at char:", char);
    if (char === ',' && endBlockChar === '' && partialKey.length > 0) {
      // end of non-string and non-unit8 array key part
      LOG_ENABLED && console.log("Processing end of non-string and non-uint8 array:", partialKey.join(''));
      processPart(partialKey.join(''), key);
      partialKey = [];
    } else if (char === ',' && endBlockChar === '') {
      // end of string or unit8 array key part, skip comma
      LOG_ENABLED && console.log("End of string or unit8 array, skipping comma");
    } else if (isStringChar(char)) {
      if (partialKey.length === 0) {
        // start of string
        endBlockChar = char;
        partialKey.push(char);
        LOG_ENABLED && console.log("Start of string, pushing:", char);
      } else if (endBlockChar === char && input[i-1] !== `\\`) {
        // end of string
        endBlockChar = '';
        partialKey.push(char);
        LOG_ENABLED && console.log("End of string, processing:", partialKey.join(''));
        processPart(partialKey.join(''), key);
        partialKey = [];
      } else {
        // middle of string with escaped or different string char
        partialKey.push(char);
        LOG_ENABLED && console.log("Middle of string, pushing:", char);
      }
    } else if (char === '[' && partialKey.length === 0) {
      // start of unit8 array
      endBlockChar = ']';
      partialKey.push(char);
      LOG_ENABLED && console.log("Start of unit8 array");
    } else if (char === ']' && endBlockChar === ']') {
      // end of unit8 array
      endBlockChar = '';
      partialKey.push(char);
      LOG_ENABLED && console.log("End of unit8 array, processing:", partialKey.join(''));
      processPart(partialKey.join(''), key);
      partialKey = [];
    } else {
      if ((char === ' ' || char === ',') && isStringChar(endBlockChar)) {
        // Space or comma inside string
        LOG_ENABLED && console.log("Space or comma inside string, pushing:", char);
        partialKey.push(char);
      } else if (char !== ' ') {
        // Not a space, could be a comma outside string (e.g. unit8 array)
        LOG_ENABLED && console.log("Pushing:", char);
        partialKey.push(char);
      } else {
        // Skip space outside of string
        LOG_ENABLED && console.log("Skipping space outside of string");
      }
    }
  }
  if (partialKey.length > 0) {
    LOG_ENABLED && console.log("Processing end of input:", partialKey.join(''));
    processPart(partialKey.join(''), key);
  }

  return key;
}

function isStringChar(char: string) {
  return char === '"' || char === "'" || char === '`';
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
