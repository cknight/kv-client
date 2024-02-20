import { assertEquals } from "$std/assert/mod.ts";
import { env } from "../../consts.ts";
import { localKv } from "../kv/db.ts";
import { _setKv, getEncryptedString, storeEncryptedString } from "../transform/encryption.ts";

Deno.test("Encryption/decryption work correctly with in-memory key", async () => {
  const kvKey = ["encryption test"];
  try {
    const value = "test-value";
    await storeEncryptedString(kvKey, value);
    const retrievedValue = await getEncryptedString(kvKey);
    assertEquals(retrievedValue, value);
  } finally {
    await localKv.delete(kvKey);
  }
});

Deno.test("Encryption/decryption work correctly with user supplied key", async () => {
  const kvKey = ["encryption test"];
  try {
    const value = "test-value";
    Deno.env.set(env.KV_CLIENT_ENCRYPTION_KEY, "test-key-1234-abcd");
    await storeEncryptedString(kvKey, value);
    const retrievedValue = await getEncryptedString(kvKey);
    assertEquals(retrievedValue, value);
  } finally {
    await localKv.delete(kvKey);
    Deno.env.delete(env.KV_CLIENT_ENCRYPTION_KEY);
  }
});

Deno.test("getEncryptedString returns null for non-existent kv keys", async () => {
  const kvKey = ["some non-existent key"];
  const retrievedValue = await getEncryptedString(kvKey);
  assertEquals(retrievedValue, null);
});

Deno.test("getEncryptedString returns null for encrypted string which was encrypted by another key", async () => {
  const kvKey = ["encryption test"];
  try {
    const value = "test-value";
    Deno.env.set(env.KV_CLIENT_ENCRYPTION_KEY, "test-key-1234-abcd");
    await storeEncryptedString(kvKey, value);

    //remove the key from the environment so that the in-memory key is used for decryption
    Deno.env.delete(env.KV_CLIENT_ENCRYPTION_KEY);

    const retrievedValue = await getEncryptedString(kvKey);
    assertEquals(retrievedValue, null);
  } finally {
    await localKv.delete(kvKey);
  }
});

Deno.test({
  name: "Encryption keys should expire if specified",
  async fn() {
    const kvKey = ["encryption test"];
    let newKv: Deno.Kv;
    try {
      const value = "test-value";
      await storeEncryptedString(kvKey, value, 1);
      const retrievedValue = await getEncryptedString(kvKey);
      assertEquals(retrievedValue, value);
      localKv.close();

      await new Promise((resolve) => setTimeout(resolve, 2));

      //Close, then open KV to force cleanup of expired keys
      //otherwise, can take 20+ seconds for the cleanup to occur
      newKv = await Deno.openKv();
      _setKv(newKv);

      const retrievedValue2 = await getEncryptedString(kvKey);
      assertEquals(retrievedValue2, null);
    } finally {
      await newKv!.delete(kvKey);
      newKv!.close();
    }
  },
  sanitizeResources: false,
});
