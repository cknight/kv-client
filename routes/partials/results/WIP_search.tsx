import { defineRoute, RouteConfig } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { searchKv } from "../../../utils/kvSearch.ts";
import { SearchBox } from "../../../islands/SearchBox.tsx";
import { SearchResults } from "../../../islands/SearchResults.tsx";
import { signal } from "@preact/signals";

// We only want to render the content, so disable
// the `_app.tsx` template as well as any potentially
// inherited layouts
export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default defineRoute(async (req, ctx) => {
  const form = await req.formData();
  const prefix = form.get("prefix")?.toString() || "";
  const start = form.get("start")?.toString() || "";
  const end = form.get("end")?.toString() || "";
  const limit = form.get("limit")?.toString() || "";
  const reverse = form.get("reverse")?.toString() === "on";
  const from = parseInt(form.get("from")?.toString() || "1");
  const show = parseInt(form.get("show")?.toString() || "10");
  const formIds = signal<string[]>([]);

  let failReason;
  const results: Deno.KvEntry<unknown>[] = [];
  let searchComplete = false;
  const session = (ctx.state as Record<string, unknown>).session as string;
  try {
    const partialResults = await searchKv({ session, prefix, start, end, limit, reverse });
    results.push(...partialResults.results);
    searchComplete = partialResults.cursor === false;
  } catch (e) {
    failReason = e.message || "Unknown error occurred";
    console.error(e);
  }

  // Only render the new content
  return (
    <Partial name="docs-content">
        <SearchBox
          prefix={prefix}
          start={start}
          end={end}
          limit={limit}
          reverse={reverse}
          formIds={formIds}
        />
        <SearchResults
          results={results}
          validationError={failReason}
          formIds={formIds}
          show={show}
          from={from}
          searchComplete={searchComplete}
        />
    </Partial>
  );
});
