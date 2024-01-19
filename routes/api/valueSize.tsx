import { Handlers } from "$fresh/server.ts";
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
  async POST(req, _ctx) {
    const value = await req.json();
    try {
      const kvValue: unknown = buildKvValue(value.valueString, value.valueType);
      const size = readableSize(approximateSize(kvValue));
      return new Response(size, {
        status: 200,
      });
    } catch (_e) {
      console.log("oops", _e);
      return new Response("Invalid value", {
        status: 422,
      });
    }
  },
};
