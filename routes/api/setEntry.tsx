import { Handlers } from "$fresh/server.ts";
import { SetAuditLog, SupportedValueTypes } from "../../types.ts";
import { executorId } from "../../utils/connections/denoDeploy/deployUser.ts";
import { ValidationError } from "../../utils/errors.ts";
import { auditAction, auditConnectionName } from "../../utils/kv/kvAudit.ts";
import { establishKvConnection } from "../../utils/kv/kvConnect.ts";
import { parseKvKey } from "../../utils/transform/kvKeyParser.ts";
import { setAll } from "../../utils/kv/kvSet.ts";
import { getUserState } from "../../utils/state/state.ts";
import { buildKvValue } from "../../utils/transform/kvValueParser.ts";
import { json5Stringify } from "../../utils/transform/stringSerialization.ts";
import { asMaxLengthString } from "../../utils/utils.ts";

export interface KvSetEntry {
  key: string;
  kvValue: string;
  valueType: SupportedValueTypes;
  doNotOverwrite: boolean;
  connectionId: string;
}

export const handler: Handlers = {
  /**
   * Validate and set a new KV entry
   *
   * @param req
   * @param ctx
   * @returns TODO
   */
  async POST(req, ctx) {
    const start = Date.now();
    const { key: keyString, kvValue: valueString, valueType, doNotOverwrite, connectionId } =
      await req.json() as KvSetEntry;

    let status = 200;
    let body = "";

    try {
      const kvKey: Deno.KvKey = parseKvKey(keyString);

      const session = ctx.state.session as string;
      const state = getUserState(session);
      let kv = state.kv;
      if (!kv) {
        await establishKvConnection(session, connectionId);
      }
      kv = state.kv!;

      if (doNotOverwrite) {
        const existingEntry = await kv.get(kvKey);
        if (existingEntry.versionstamp !== null) {
          throw new ValidationError("Key already exists");
        }
      }

      const kvValue: unknown = buildKvValue(valueString, valueType);

      const entry: Deno.KvEntry<unknown> = { key: kvKey, value: kvValue, versionstamp: "1" };
      const result = await setAll([entry], kv, "");
      const { setKeyCount, writeUnitsConsumed, lastSuccessfulVersionstamp } = result;

      const overallDuration = Date.now() - start;

      const setAudit: SetAuditLog = {
        auditType: "set",
        executorId: await executorId(session),
        connection: auditConnectionName(state.connection!),
        infra: state.connection!.infra,
        rtms: overallDuration,
        setSuccessful: setKeyCount === 1,
        key: keyString,
        value: asMaxLengthString(json5Stringify(kvValue, true), 30000),
        writeUnitsConsumed: writeUnitsConsumed,
        versionstamp: lastSuccessfulVersionstamp,
      };
      await auditAction(setAudit);

      console.debug("Set result", result);

      if (result.setKeyCount === 1) {
        body = "Entry successfully set";
        getUserState(session).cache.clear();
      } else {
        body = "Entry failed to set";
        status = 500;
      }
    } catch (e) {
      console.log(e);
      console.error("Error setting entry", e);
      status = 500;
      body = "Error setting entry: " + e.message;
    }

    return new Response(body, {
      status: status,
    });
  },
};
