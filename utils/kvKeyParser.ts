export function parseKvKey(input: string): Deno.KvKey {
  if (input === "") return [];

  const key: Deno.KvKeyPart[] = [];

  const keyParts = input.split(',').map((part) => part.trim());
  for (const keyPart of keyParts) {
    if ((keyPart.startsWith("'") && keyPart.endsWith("'")) ||
        (keyPart.startsWith('`') && keyPart.endsWith('`')) ||
        (keyPart.startsWith('"') && keyPart.endsWith('"'))) {
      // string type
      key.push(keyPart.slice(1, -1));
    } else if (keyPart === 'true' || keyPart === 'false') {
      // boolean type
      key.push(keyPart === 'true');
    } else if (/^-?\d+n$/.test(keyPart)) {
      // bigint type
      key.push(BigInt(keyPart.slice(0, -1)));
    } else if (/^-?\d+$/.test(keyPart)) {
      // number type
      key.push(Number(keyPart));
    } else {
      console.log("Unrecognized key part: " + keyPart);
    }

    // TODO
    // Need to handle commas in strings, unit8 arrays, and unrecognized key parts
    // Need to write tests
    // const nasty = "abcd,ef\",ghi";
  }


  return key;
}