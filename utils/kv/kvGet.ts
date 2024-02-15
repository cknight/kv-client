import { GetAuditLog, KvGetOptions } from "../../types.ts";
import { executorId } from "../connections/denoDeploy/deployUser.ts";
import { getUserState } from "../state/state.ts";
import { parseKvKey } from "../transform/kvKeyParser.ts";
import { auditAction } from "./kvAudit.ts";
import { establishKvConnection } from "./kvConnect.ts";
import { computeSize, readUnitsConsumed } from "./kvUnitsConsumed.ts";

export async function getKv(getOptions: KvGetOptions): Promise<Deno.KvEntryMaybe<unknown>> {
  const { session, connectionId, key } = getOptions;
  const state = getUserState(session);

  const kv = await establishKvConnection(session, connectionId);

  const kvKey = parseKvKey(key);
  console.debug(`kv.get([${key}]) for connection ${connectionId}`);

  const start = Date.now();
  const entry = await kv!.get(kvKey);
  const queryTime = Date.now() - start;

  let size = 0;
  if (entry.versionstamp !== null) {
    size = computeSize(entry.key, entry.value);
  }

  const audit: GetAuditLog = {
    auditType: "get",
    executorId: await executorId(session),
    connection: connectionId,
    infra: state.connection!.infra,
    rtms: queryTime,
    key: `[${key}]`,
    resultVersionstamp: entry.versionstamp,
    readUnitsConsumed: readUnitsConsumed(size),
  };
  await auditAction(audit);

  return entry;
}
