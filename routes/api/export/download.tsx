import { Handlers } from "$fresh/server.ts";
import { EXPORT_PATH } from "../../../consts.ts";
import { localKv } from "../../../utils/kv/db.ts";
import { getExportStatus } from "../../../utils/state/state.ts";

/**
 * This is the final step of the export journey.  By this point, all keys will have been read from the 
 * KV connection and populated in the temporary file.  We now need to stream this file to the user.
 * The file will be cleaned up in 24 hours via a KV queue message.
 */
export const handler: Handlers = {
  async GET(req, ctx) {
    const exportId = new URL(req.url).searchParams.get("exportId");
    const session = ctx.state.session as string;

    if (!exportId) {
      return new Response("No export id provided", { status: 400});
    }

    const status = getExportStatus(exportId);
    if (!status) {
      return new Response("No export found for id " + exportId, { status: 400 });
    }
    if (status.status !== "complete") {
      return new Response("Export still in progress", {status: 400});
    }

    const exportFilePath = (await localKv.get<string>([EXPORT_PATH, session, exportId])).value;
    if (!exportFilePath) {
      return new Response("No export file found", {status: 400});
    }
    
    const exportFile = await Deno.open(exportFilePath, {read: true, write: false});
    return new Response(exportFile.readable);
  },
}