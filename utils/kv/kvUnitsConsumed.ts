import { AuditRecord, UnitsConsumed } from "../../types.ts";
import { logDebug } from "../log.ts";
import { approximateSize } from "../utils.ts";
import { localKv } from "./db.ts";

const BYTES_PER_READ_UNIT = 1024 * 4;
const BYTES_PER_WRITE_UNIT = 1024;

/**
 * See https://deno.land/api?s=Deno.Kv&unstable=
 * "one can usually assume that the serialization of any value is about the same length
 *  as the resulting string of a JSON serialization of that same value"
 * @returns an approximate size of both the key and value (if supplied) in bytes
 */
export function computeSize(key: Deno.KvKey, value?: unknown): number {
  try {
    const keySize = approximateSize(key);
    const serializedValue = approximateSize(value);
    return keySize + serializedValue;
  } catch (e) {
    console.error("Error computing size:", e);
    return 0;
  }
}

export function readUnitsConsumed(bytesSent: number): number {
  return Math.ceil(bytesSent / BYTES_PER_READ_UNIT);
}

export function writeUnitsConsumed(bytesSent: number): number {
  return Math.ceil(bytesSent / BYTES_PER_WRITE_UNIT);
}

export async function unitsConsumedToday(session: string): Promise<UnitsConsumed> {
  const auditIterator = localKv.list<AuditRecord>({
    prefix: ["audit"],
    start: ["audit", getStartOfUTCDay()],
  });
  let readUnits = 0;
  let writeUnits = 0;
  let operations = 0;
  let totalAuditsToday = 0;
  let totalRemoteAuditsToday = 0;
  for await (const audit of auditIterator) {
    totalAuditsToday++;
    const auditLog = audit.value;

    if (auditLog.infra === "Deploy") {
      totalRemoteAuditsToday++;
      operations++;
      if ("readUnitsConsumed" in auditLog) {
        readUnits += auditLog.readUnitsConsumed;
      }
      if ("writeUnitsConsumed" in auditLog) {
        writeUnits += auditLog.writeUnitsConsumed;
      }
    }
  }
  const result = { operations, read: readUnits, write: writeUnits };
  logDebug(
    { sessionId: session },
    `Units consumed today (${totalRemoteAuditsToday} remote ops from ${totalAuditsToday} total ops): ${
      JSON.stringify(result)
    }`,
  );
  return result;
}

function getStartOfUTCDay(): number {
  const date = new Date();
  date.setUTCHours(0);
  date.setUTCMilliseconds(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  return date.getTime();
}
