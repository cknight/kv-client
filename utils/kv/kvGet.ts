import { parse } from "$std/path/parse.ts";
import { GetAuditLog, KvGetOptions, OpStats } from "../../types.ts";
import { executorId } from "../connections/denoDeploy/deployUser.ts";
import { ValidationError } from "../errors.ts";
import { getUserState } from "../state/state.ts";
import { parseKvKey } from "../transform/kvKeyParser.ts";
import { auditAction } from "./kvAudit.ts";
import { establishKvConnection } from "./kvConnect.ts";
import { computeSize, readUnitsConsumed } from "./kvUnitsConsumed.ts";

export async function getKv(getOptions: KvGetOptions): Promise<Deno.KvEntryMaybe<unknown>> {
  const { session, connectionId, key } = getOptions;
  const state = getUserState(session);

  await establishKvConnection(session, connectionId);

  if (!state.kv) {
    throw new ValidationError(
      "Please connect to a KV instance first",
    );
  }

  const kvKey = parseKvKey(key);
  console.debug(`kv.get([${key}]) for connection ${connectionId}`);

  const start = Date.now();
  const entry = await state.kv!.get(kvKey);
  const queryTime = Date.now() - start;

  let size = 0;
  if (entry.versionstamp !== null) {
    size = computeSize(entry.key, entry.value);
  }

  const audit: GetAuditLog = {
    auditType: "get",
    executorId: await executorId(session),
    connection: connectionId,
    isDeploy: false,
    rtms: queryTime,
    key: `[${key}]`,
    resultVersionstamp: entry.versionstamp,
    readUnitsConsumed: readUnitsConsumed(size),
  };
  await auditAction(audit);

  return entry;
}
