import { Handlers } from "$fresh/server.ts";
import { getExportStatus } from "../../../utils/state/state.ts";

export const handler: Handlers = {
  GET(req, ctx) {
    const exportId = new URL(req.url).searchParams.get("exportId");
    if (!exportId) {
      return new Response("No connectionId provided", { status: 400 });
    }

    const status = getExportStatus(exportId);

    if (!status) {
      return new Response("No status found", { status: 400 });
    }

    return Response.json(status);
  },
};
