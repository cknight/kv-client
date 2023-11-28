import { env } from "../../consts.ts";
import { localKv } from "../kv/db.ts";

let kv = localKv;

async function importKey(password: string, suppliedSalt?: Uint8Array): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const salt = suppliedSalt || window.crypto.getRandomValues(new Uint8Array(16));
  const importedPassword = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey", "deriveBits"],
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    importedPassword,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return { key, salt };
}

const staticCryptoKey = await crypto.subtle.generateKey(
  {
    name: "AES-GCM",
    length: 256,
  },
  false,
  ["encrypt", "decrypt"],
);

async function encryptString(
  key: CryptoKey,
  data: string,
): Promise<{ iv: Uint8Array; encryptedString: ArrayBuffer }> {
  const encoded = new TextEncoder().encode(data);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedString = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoded,
  );
  return { iv, encryptedString };
}

async function decryptString(key: CryptoKey, iv: Uint8Array, cipherText: ArrayBuffer): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    cipherText,
  );
  return new TextDecoder().decode(decrypted);
}

type EncryptedData = {
  iv: Uint8Array;
  cipherText: Uint8Array;
  salt?: Uint8Array;
};

/**
 * Store a string value on KV as an encrypted value.  Encryption is symmetric using either an in-memory key
 * which will be lost on process end/restart, or a user-supplied key via the KV_CLIENT_ENCRYPTION_KEY
 * environment variable.
 * 
 * @param kvKey 
 * @param value 
 */
export async function storeEncryptedString(kvKey: Deno.KvKey, value: string, expiryMs?: number): Promise<void> {
  const userSuppliedKey = Deno.env.get(env.KV_CLIENT_ENCRYPTION_KEY);
  if (userSuppliedKey) {
    const {key, salt} = await importKey(userSuppliedKey);
    const {iv, encryptedString} = await encryptString(key, value);
    const encryptedData: EncryptedData = { iv, cipherText: new Uint8Array(encryptedString), salt };
    await kv.set(kvKey, encryptedData, expiryMs ? {expireIn: expiryMs} : undefined);
  } else {
    const {iv, encryptedString} = await encryptString(staticCryptoKey, value);
    const encryptedData: EncryptedData = { iv, cipherText: new Uint8Array(encryptedString) };
    await kv.set(kvKey, encryptedData, expiryMs ? {expireIn: expiryMs} : undefined);
  }
}

/**
 * Retrieve a string value from KV that was stored as an encrypted value.  Encryption is symmetric using
 * either an in-memory key which will be lost on process restart, or a user-supplied key via the 
 * KV_CLIENT_ENCRYPTION_KEY environment variable.
 * 
 * @param kvKey 
 * @returns unencrypted string value or null if the encrypted value either does not exist or was encrypted with a different key
 */
export async function getEncryptedString(kvKey: Deno.KvKey): Promise<string | null> {
  const userSuppliedKey = Deno.env.get(env.KV_CLIENT_ENCRYPTION_KEY);
  const encryptedData = await kv.get<EncryptedData>(kvKey);
  if (encryptedData.value) {
    let key = staticCryptoKey;
    if (userSuppliedKey) {
      key = (await importKey(userSuppliedKey, encryptedData.value.salt)).key;
    }
    try {
      const decrypted = await decryptString(key, encryptedData.value.iv, encryptedData.value.cipherText.buffer);
      return decrypted;
    } catch (e) {
      console.error(`Error decrypting value.  Returning null. KV Key ${Deno.inspect(kvKey)}:`,e);
      return null;
    }
  } else {
    return null;
  }
}

export function _setKv(newKv: Deno.Kv) {
  kv = newKv;
}