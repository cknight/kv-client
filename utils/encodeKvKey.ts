import { KvUIEntry } from "../types.ts";

const encoder = new TextEncoder();
// From https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem.
export function keyToBase64(kvUiEntry: KvUIEntry): string {
  const binString = String.fromCodePoint(...encoder.encode(kvUiEntry.key));
  return btoa(binString);
}
