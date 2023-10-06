import { Handlers, PageProps } from "$fresh/server.ts";
import { signal } from "@preact/signals";
import { SearchBox } from "../islands/SearchBox.tsx";
import {
  CONNECTIONS_KEY_PREFIX,
  KvConnection,
  KvUIEntry,
  SearchData,
} from "../types.ts";
import { parseKvKey } from "../utils/kvKeyParser.ts";
import { ValidationError } from "../utils/validationError.ts";
import { SearchResults } from "../islands/SearchResults.tsx";
import { searchKv } from "../utils/kvSearch.ts";
import { establishKvConnection } from "../utils/kvConnect.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const prefix = form.get("prefix")?.toString() || "";
    const start = form.get("start")?.toString() || "";
    const end = form.get("end")?.toString() || "";
    const limit = form.get("limit")?.toString() || "";
    const reverse = form.get("reverse")?.toString() === "true";
    let failReason;
    const results: KvUIEntry[] = [];
    const session = ctx.state.session as string;
    try {
      results.push(
        ...await searchKv({ session, prefix, start, end, limit, reverse }),
      );
    } catch (e) {
      failReason = e.message || "Unknown error occurred";
      console.error(e);
    }

    return await ctx.render({
      prefix,
      start,
      end,
      limit,
      reverse,
      results,
      validationError: failReason,
    });
  },
};

export default function Search(props: PageProps<SearchData>) {
  const prefix = props.data?.prefix || "";
  const start = props.data?.start || "";
  const end = props.data?.end || "";
  const limit = props.data?.limit || "10";
  const reverse = props.data?.reverse || false;
  const results = props.data?.results;
  const validationError = props.data?.validationError;

  return (
    <>
      <SearchBox
        prefix={prefix}
        start={start}
        end={end}
        limit={limit}
        reverse={reverse}
      />
      <SearchResults results={results} validationError={validationError} />
    </>
  );
}
