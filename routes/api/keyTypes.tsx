import { Handlers } from "$fresh/server.ts";
import { parseKvKey } from "../../utils/transform/kvKeyParser.ts";

export const handler: Handlers = {
  /**
   * For a given key string, convert to a KvKey and return the types of each part.
   * @param req
   * @param ctx
   * @returns <empty>, <invalid>, or a comma-separated list of types
   */
  async POST(req, _ctx) {
    const key = await req.text();

    let responseTypes = "";
    try {
      const kvKey = parseKvKey(key);
      if (kvKey.length === 0) {
        responseTypes = "<empty>";
      } else {
        const types = kvKey.map((item) => {
          const type = typeof item;
          return type === "object" ? item.constructor.name : type;
        });
        responseTypes = `[${types.join(", ")}]`;
      }
    } catch (e) {
      responseTypes = "<invalid>";
    }

    return new Response(responseTypes, {
      status: 200,
    });
  },
};
