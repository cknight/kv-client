import { ListAuditLog } from "../../types.ts";
import { delay } from "$std/async/delay.ts";
import { localKv } from "./db.ts";

const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30;

export async function auditListAction(audit: ListAuditLog) {
  let auditSuccess = false;
  let attempts = 0;
  while (attempts < 10 && !auditSuccess) {
    const key = ["audit", Date.now()];
    const result = await localKv.atomic()
      .check({ key, versionstamp: null })
      .set(key, audit, {
        expireIn: THIRTY_DAYS_IN_MS,
      })
      .commit();
    auditSuccess = result.ok;
    if (!auditSuccess) {
      console.debug("Audit key collision, trying again");
      await delay(1);
      attempts++;
    } else {
      console.debug("Audit successful:", audit);
    }
  }
  if (!auditSuccess) {
    console.error("Failed to audit list action after 10 attempts", audit);
  }
}
