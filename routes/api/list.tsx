import { Handlers } from "$fresh/server.ts";
import { KvUIEntry, Stats } from "../../types.ts";
import { getResults, ListInputData } from "../../utils/ui/list/listHelper.ts";
import { ListData } from "../list.tsx";

export type ListAPIResponseData = {
  results: KvUIEntry[] | undefined;
  fullResultsCount: number;
  filtered: boolean;
  listComplete: boolean;
  validationError?: string;
  stats?: Stats;
};

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    console.log(form);
    const session = ctx.state.session as string;
    const listInputData: ListInputData = {
      prefix: form.get("prefix")?.toString() || "",
      start: form.get("start")?.toString() || "",
      end: form.get("end")?.toString() || "",
      limit: form.get("limit")?.toString() || "",
      reverse: form.get("reverse")?.toString() === "on",
      from: parseInt(form.get("from")?.toString() || "1"),
      show: parseInt(form.get("show")?.toString() || "10"),
      filter: form.get("filter")?.toString() || undefined,
      disableCache: form.get("disableCache")?.toString() === "on",
      connectionId: form.get("connectionId")?.toString() || "",
    };

    if (!listInputData.connectionId) {
      return new Response("No connectionId supplied", {
        status: 400,
      });
    }

    const searchData = await getResults(listInputData, session);
    const responseData: ListAPIResponseData = {
      results: searchData.results,
      fullResultsCount: searchData.fullResultsCount,
      filtered: searchData.filtered,
      listComplete: searchData.listComplete,
      validationError: searchData.validationError,
      stats: searchData.stats,
    };

    return Response.json(JSON.stringify(responseData));
  },
};
