import { approximateSize } from "../utils.ts";
import { writeUnitsConsumed } from "./kvUnitsConsumed.ts";

/**
 * For an atomic operation containing only deletes, constraints will be 1000 deletes or
 * 80kb worth of keys, whichever is reached first.
 */
const MAX_NUM_OPS_PER_TRANSACTION = 1000;
const MAX_KV_KEY_SIZE = 1024 * 2; //bytes (2kb)
const MAX_TRANSACTION_KEY_SIZE = 1024 * 80; //bytes (80kb)

// The biggest size to which a new key can be added without exceeding the max transaction
// key size (plus a buffer of one additional key size to account for imprecision in the
// size calculation).
const SAFE_MAX_ATOMIC_KEY_SIZE = MAX_TRANSACTION_KEY_SIZE - MAX_KV_KEY_SIZE - 1024; // 1-3kb buffer

export const abortSet = new Set<string>();

export interface DeleteResult {
  failedKeys: Deno.KvKey[];
  aborted: boolean;
  deletedKeyCount: number;
  writeUnitsConsumed: number;
}

/**
 * A fast, efficient and abortable way to delete a large number of keys from KV
 *
 * @param keysToDelete - list of Deno.KvKeys to delete
 * @param kv - Connected Deno.Kv instance
 * @param abortId - unique id to abort the delete operation
 * @returns list of keys which failed to delete
 */
export async function deleteAll(
  keysToDelete: Deno.KvKey[],
  kv: Deno.Kv,
  abortId: string,
): Promise<DeleteResult> {
  let atomic = kv.atomic();
  let count = 0;
  let deletedKeyCount = 0;
  let transactionSize = 0;
  let totalWriteUnits = 0;
  let keysInAction = [];
  const failedKeys: Deno.KvKey[] = [];

  for (const key of keysToDelete) {
    if (abortSet.has(abortId)) {
      return {
        failedKeys,
        aborted: true,
        deletedKeyCount,
        writeUnitsConsumed: totalWriteUnits,
      };
    }

    //Add key to atomic transaction and update transaction size
    atomic.delete(key);
    keysInAction.push(key);
    transactionSize += approximateSize(key);

    if (++count === MAX_NUM_OPS_PER_TRANSACTION || transactionSize > SAFE_MAX_ATOMIC_KEY_SIZE) {
      // transaction count or size limit reached, commit transaction and reset
      try {
        await atomic.commit();
        deletedKeyCount += count;
        totalWriteUnits += writeUnitsConsumed(transactionSize);
      } catch (e) {
        console.error("Atomic delete transaction failed.  Retrying keys individually.", e);
        const result = await retryDeleteIndividually(keysInAction, kv, abortId);
        failedKeys.push(...result.failedKeys);
        deletedKeyCount += result.deletedKeyCount;
        totalWriteUnits += result.writeUnitsConsumed;

        if (result.aborted) {
          return {
            failedKeys,
            aborted: true,
            deletedKeyCount,
            writeUnitsConsumed: totalWriteUnits,
          };
        }
      }
      atomic = kv.atomic();
      count = 0;
      transactionSize = 0;
      keysInAction = [];
    }
  }

  // These are the remaining keys in the final transaction which have not been committed yet
  if (count > 0 && !abortSet.has(abortId)) {
    try {
      await atomic.commit();
      deletedKeyCount += count;
      totalWriteUnits += writeUnitsConsumed(transactionSize);
    } catch (e) {
      console.error("Atomic delete transaction failed.  Retrying keys individually.", e);
      const result = await retryDeleteIndividually(keysInAction, kv, abortId);
      failedKeys.push(...result.failedKeys);
      deletedKeyCount += result.deletedKeyCount;
      totalWriteUnits += result.writeUnitsConsumed;

      if (result.aborted) {
        return {
          failedKeys,
          aborted: true,
          deletedKeyCount,
          writeUnitsConsumed: totalWriteUnits,
        };
      }
    }
  }

  return {
    failedKeys,
    aborted: false,
    deletedKeyCount: deletedKeyCount,
    writeUnitsConsumed: totalWriteUnits,
  };
}

/* Fallback to delete keys individually if atomic transactions fail */
async function retryDeleteIndividually(
  keys: Deno.KvKey[],
  kv: Deno.Kv,
  abortId: string,
): Promise<DeleteResult> {
  const failedKeys: Deno.KvKey[] = [];
  let deletedKeys = 0;
  let totalWriteUnits = 0;

  for (const key of keys) {
    if (abortSet.has(abortId)) {
      return {
        failedKeys,
        aborted: true,
        deletedKeyCount: deletedKeys,
        writeUnitsConsumed: totalWriteUnits,
      };
    }
    try {
      await kv.delete(key);
      deletedKeys++;
      totalWriteUnits += writeUnitsConsumed(approximateSize(key));
    } catch (e) {
      console.error("Failed to delete key", key, e);
      failedKeys.push(key);
    }
  }
  return {
    failedKeys,
    aborted: false,
    deletedKeyCount: deletedKeys,
    writeUnitsConsumed: totalWriteUnits,
  };
}
