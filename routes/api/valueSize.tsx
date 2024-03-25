import { Handlers } from "$fresh/server.ts";
import { logDebug } from "../../utils/log.ts";
import { buildKvValue } from "../../utils/transform/kvValueParser.ts";
import { approximateSize, readableSize } from "../../utils/utils.ts";

export interface KvValueJson {
  valueString: string;
  valueType: string;
}

/**
 * API to get the approximate size of a KV value, in readable format
 */
export const handler: Handlers = {
  async POST(req, ctx) {
    const value = await req.json();
    const session = ctx.state.session as string;
    try {
      const kvValue: unknown = buildKvValue(value.valueString, value.valueType);
      if (value.valueType === "Date" && isNaN((kvValue as Date).getTime())) {
        throw new Error("Invalid date");
      }
      const size = readableSize(approximateSize(kvValue));
      return new Response(size, {
        status: 200,
      });
    } catch (_e) {
      logDebug({ sessionId: session }, "Failed to calculate value size", _e);
      return new Response("Invalid value", {
        status: 422,
      });
    }
  },
};
