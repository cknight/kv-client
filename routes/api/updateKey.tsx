import { Handlers } from "$fresh/server.ts";
import { UpdateAuditLog } from "../../types.ts";
import { executorId } from "../../utils/connections/denoDeploy/deployUser.ts";
import { auditAction, auditConnectionName } from "../../utils/kv/kvAudit.ts";
import { establishKvConnection } from "../../utils/kv/kvConnect.ts";
import { setAll, SetResult } from "../../utils/kv/kvSet.ts";
import { getUserState } from "../../utils/state/state.ts";
import { json5Parse, json5Stringify } from "../../utils/transform/stringSerialization.ts";
import { entriesToOperateOn } from "../../utils/ui/buildResultsPage.ts";
import { asMaxLengthString } from "../../utils/utils.ts";

export interface UpdateKeyData {
  connectionId: string;
  keyHash: string;
  value: string;
  prefix: string;
  start: string;
  end: string;
  from: number;
  show: number;
  reverse: boolean;
}

interface UpdateOpResult {
  duration: number;
  updateResult: Omit<SetResult, "aborted">;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = ctx.state.session as string;
    const data = await req.json() as UpdateKeyData;
    let status = 200;
    let body = "";

    try {
      const result = await updateKey(data, session);
      console.debug("Update result", result);

      if (result.updateResult.setKeyCount === 1) {
        body = "Update successful";
        getUserState(session).cache.clear();
      } else {
        body = "Update failed";
        status = 500;
      }
    } catch (e) {
      console.error("Error updating key", e.message);
      status = 500;
      body = e.message;
    }

    return new Response(body, {
      status,
    });
  },
};

async function updateKey(data: UpdateKeyData, session: string): Promise<UpdateOpResult> {
  const startTime = Date.now();
  const kvValue = json5Parse(data.value) as unknown;

  const { connectionId, prefix, start, end, from, show, reverse } = data;
  const keyOperationData = {
    connectionId,
    keysSelected: [data.keyHash],
    prefix,
    start,
    end,
    reverse,
    from,
    show,
  };

  //Find the matching Deno.KvEntry
  const matchedEntry = await entriesToOperateOn(keyOperationData, session);

  if (matchedEntry.length !== 1) {
    throw new Error(
      `Expected to find matching entry for update, found ${matchedEntry.length}`,
    );
  }

  const state = getUserState(session);
  let kv = state.kv;
  if (!kv) {
    await establishKvConnection(session, state.connection!.id);
  }
  kv = state.kv!;
  const entry: Deno.KvEntry<unknown> = {
    key: matchedEntry[0].key,
    value: kvValue,
    versionstamp: "1",
  };
  const { failedKeys, setKeyCount, writeUnitsConsumed } = await setAll([entry], kv, "");

  const overallDuration = Date.now() - startTime;

  const updateAudit: UpdateAuditLog = {
    auditType: "update",
    executorId: executorId(session),
    connection: auditConnectionName(state.connection!),
    isDeploy: state.connection!.isRemote,
    rtms: overallDuration,
    updateSuccessful: setKeyCount === 1,
    key: json5Stringify(entry.key, true),
    originalValue: asMaxLengthString(json5Stringify(matchedEntry[0].value, true), 30000),
    newValue: asMaxLengthString(json5Stringify(kvValue, true), 30000),
    writeUnitsConsumed: writeUnitsConsumed,
  };
  await auditAction(updateAudit);

  return {
    duration: overallDuration,
    updateResult: {
      failedKeys,
      setKeyCount,
      writeUnitsConsumed,
    },
  };
}
