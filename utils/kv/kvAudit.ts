import { delay } from "$std/async/delay.ts";
import { AuditRecord, KvConnection } from "../../types.ts";
import { logDebug } from "../log.ts";
import { localKv } from "./db.ts";

const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30;

export async function auditAction(audit: AuditRecord, session: string) {
  let auditSuccess = false;
  let attempts = 0;
  while (attempts < 10 && !auditSuccess) {
    const key = ["audit", new Date().toISOString() + 'Z'];
    const result = await localKv.atomic()
      .check({ key, versionstamp: null })
      .set(key, audit, {
        expireIn: THIRTY_DAYS_IN_MS,
      })
      .commit();
    auditSuccess = result.ok;
    if (!auditSuccess) {
      logDebug({ sessionId: session }, "Audit key collision, trying again");
      await delay(1);
      attempts++;
    } else {
      logDebug({ sessionId: session }, "Audit successful:", audit);
    }
  }
  if (!auditSuccess) {
    console.error("Failed to audit action after 10 attempts", audit);
  }
}

export function auditConnectionName(connection: KvConnection): string {
  return connection.name + ` (${connection.environment}), ${connection.id}`;
}
