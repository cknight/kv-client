import { approximateSize } from "../utils.ts";
import { writeUnitsConsumed } from "./kvUnitsConsumed.ts";

export const abortSet = new Set<string>();

export interface SetResult {
  failedKeys: Deno.KvKey[];
  aborted: boolean;
  setKeyCount: number;
  writeUnitsConsumed: number;
  lastSuccessfulVersionstamp?: string;
}

/**
 * For an atomic operation containing only sets, constraints will be 1000 sets or
 * 80kb worth of keys, or 800kb total transaction size whichever is reached first.
 */
const MAX_NUM_OPS_PER_TRANSACTION = 1000;
const MAX_KV_KEY_SIZE = 1024 * 2; //bytes (2kb)
const MAX_KV_VALUE_SIZE = 1024 * 64; //bytes (64kb)
const MAX_TRANSACTION_TOTAL_KEY_SIZE = 1024 * 80; //bytes (80kb)
const MAX_TRANSACTION_TOTAL_SIZE = 1024 * 800; //bytes (800kb)
const LARGEST_KEY_VALUE_SIZE = MAX_KV_VALUE_SIZE + MAX_KV_KEY_SIZE; //bytes (66kb)

// Since size calcs are approximate, leave a small buffer for differences in size calculations
const SAFE_MAX_ATOMIC_KEY_SIZE = MAX_TRANSACTION_TOTAL_KEY_SIZE - MAX_KV_KEY_SIZE - 1024; // 1-3kb buffer
const SAFE_MAX_ATOMIC_TRANSACTION_SIZE = MAX_TRANSACTION_TOTAL_SIZE - LARGEST_KEY_VALUE_SIZE -
  10 * 1024; // 10-74kb buffer

/**
 * A fast, efficient and abortable way to set a large number of key/value pairs into KV
 *
 * @param entries - list of Deno.KvEntrys to set
 * @param kv - Connected Deno.Kv instance
 * @param abortId - unique id to abort the setAll operation
 * @returns list of keys which failed to set
 */
export async function setAll(
  entries: Deno.KvEntry<unknown>[],
  kv: Deno.Kv,
  abortId: string,
): Promise<SetResult> {
  let atomic = kv.atomic();
  let count = 0;
  let setKeyCount = 0;
  let totalTransactionSize = 0;
  let totalKeysSize = 0;
  let totalWriteUnits = 0;
  let keysInAction = [];
  const failedKeys: Deno.KvKey[] = [];
  let lastSuccessfulVersionstamp: string | undefined = undefined;

  for (const entry of entries) {
    if (abortSet.has(abortId)) {
      return {
        failedKeys,
        aborted: true,
        setKeyCount,
        writeUnitsConsumed: totalWriteUnits,
        lastSuccessfulVersionstamp
      };
    }

    //Add key to atomic transaction and update transaction size
    atomic.set(entry.key, entry.value);
    keysInAction.push(entry);
    const entryKeySize = approximateSize(entry.key);
    totalTransactionSize += entryKeySize + approximateSize(entry.value);
    totalKeysSize += entryKeySize;

    if (
      ++count === MAX_NUM_OPS_PER_TRANSACTION ||
      totalKeysSize > SAFE_MAX_ATOMIC_KEY_SIZE ||
      totalTransactionSize > SAFE_MAX_ATOMIC_TRANSACTION_SIZE
    ) {
      // transaction count or size limit reached, commit transaction and reset
      try {
        const result = await atomic.commit();
        if (!result.ok) {
          throw new Error("Transaction failed");
        }
        lastSuccessfulVersionstamp = result.versionstamp;
        setKeyCount += count;
        totalWriteUnits += writeUnitsConsumed(totalTransactionSize);
      } catch (e) {
        console.error("Atomic set transaction failed.  Retrying keys individually.", e);
        const result = await retrySetIndividually(keysInAction, kv, abortId);
        failedKeys.push(...result.failedKeys);
        lastSuccessfulVersionstamp = result.lastSuccessfulVersionstamp;
        setKeyCount += result.setKeyCount;
        totalWriteUnits += result.writeUnitsConsumed;

        if (result.aborted) {
          return {
            failedKeys,
            aborted: true,
            setKeyCount,
            writeUnitsConsumed: totalWriteUnits,
            lastSuccessfulVersionstamp,
          };
        }
      }
      atomic = kv.atomic();
      count = 0;
      totalTransactionSize = 0;
      totalKeysSize = 0;
      keysInAction = [];
    }
  }

  // These are the remaining keys in the final transaction which have not been committed yet
  if (count > 0 && !abortSet.has(abortId)) {
    try {
      const result = await atomic.commit();
      if (!result.ok) {
        throw new Error("Transaction failed");
      }
      lastSuccessfulVersionstamp = result.versionstamp;
      setKeyCount += count;
      totalWriteUnits += writeUnitsConsumed(totalTransactionSize);
    } catch (e) {
      console.error("Atomic set transaction failed.  Retrying keys individually.", e);
      const result = await retrySetIndividually(keysInAction, kv, abortId);
      failedKeys.push(...result.failedKeys);
      lastSuccessfulVersionstamp = result.lastSuccessfulVersionstamp;
      setKeyCount += result.setKeyCount;
      totalWriteUnits += result.writeUnitsConsumed;

      if (result.aborted) {
        return {
          failedKeys,
          aborted: true,
          setKeyCount,
          writeUnitsConsumed: totalWriteUnits,
          lastSuccessfulVersionstamp,
        };
      }
    }
  }

  return {
    failedKeys,
    aborted: false,
    setKeyCount,
    writeUnitsConsumed: totalWriteUnits,
    lastSuccessfulVersionstamp,
  };
}

/* Fallback to set keys individually if atomic transactions fail */
async function retrySetIndividually(
  entries: Deno.KvEntry<unknown>[],
  kv: Deno.Kv,
  abortId: string,
): Promise<SetResult> {
  const failedKeys: Deno.KvKey[] = [];
  let setKeys = 0;
  let totalWriteUnits = 0;
  let lastSuccessfulVersionstamp: string | undefined = undefined;

  for (const entry of entries) {
    if (abortSet.has(abortId)) {
      return {
        failedKeys,
        aborted: true,
        setKeyCount: setKeys,
        writeUnitsConsumed: totalWriteUnits,
        lastSuccessfulVersionstamp,
      };
    }
    try {
      const result = await kv.set(entry.key, entry.value);
      if (!result.ok) {
        throw new Error("Set failed");
      }
      lastSuccessfulVersionstamp = result.versionstamp;
      totalWriteUnits += writeUnitsConsumed(
        approximateSize(entry.key) + approximateSize(entry.value),
      );
      setKeys++;
    } catch (e) {
      console.error("Failed to set key", entry, e);
      failedKeys.push(entry.key);
    }
  }
  return {
    failedKeys,
    aborted: false,
    setKeyCount: setKeys,
    writeUnitsConsumed: totalWriteUnits,
    lastSuccessfulVersionstamp,
  };
}
