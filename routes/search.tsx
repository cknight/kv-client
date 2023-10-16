import { Handlers, PageProps } from "$fresh/server.ts";
import { Signal } from "@preact/signals";
import { SearchBox } from "../islands/SearchBox.tsx";
import { SearchData } from "../types.ts";
import { SearchResults } from "../islands/SearchResults.tsx";
import { searchKv } from "../utils/kvSearch.ts";
import { SearchForm } from "../islands/PageForm.tsx";
import { PATError } from "../utils/errors.ts";
import { getState } from "../utils/state.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const prefix = form.get("prefix")?.toString() || "";
    const start = form.get("start")?.toString() || "";
    const end = form.get("end")?.toString() || "";
    const limit = form.get("limit")?.toString() || "";
    const reverse = form.get("reverse")?.toString() === "on";
    const from = parseInt(form.get("from")?.toString() || "1");
    const show = parseInt(form.get("show")?.toString() || "10");
    const connection = form.get("connection")?.toString() || "";
    const pat = form.get("pat")?.toString() || "";
    let patRequired = false;

    console.log("PAT:", pat);

    let failReason;
    const results: Deno.KvEntry<unknown>[] = [];
    let searchComplete = false;
    const session = ctx.state.session as string;
    try {
      const partialResults = await searchKv({ session, connection, pat, prefix, start, end, limit, reverse });
      results.push(...partialResults.results);
      searchComplete = partialResults.cursor === false;
    } catch (e) {
      if (e instanceof PATError) {
        failReason = e.message;
        patRequired = true;
      } else if (e instanceof TypeError) {
        const state = getState(ctx.state.session as string);
        if (state) {
          state.accessToken = undefined;
        } 
        failReason = e.message;
        patRequired = true;
      } else {
        failReason = e.message || "Unknown error occurred";
        console.error(e);
      } 
    }

    const searchData: SearchData = {
      prefix,
      start,
      end,
      limit,
      reverse,
      results,
      show,
      from,
      pat,
      patRequired,
      searchComplete,
      validationError: failReason,
    };

    return await ctx.render(searchData);
  },
};

export default function Search(props: PageProps<SearchData>) {
  const sp = props.url.searchParams;
  const prefix = props.data?.prefix || sp.get("prefix") || "";
  const start = props.data?.start || sp.get("start") || "";
  const end = props.data?.end || sp.get("end") || "";
  const limit = props.data?.limit || sp.get("limit") || "10";
  const reverse = props.data?.reverse || (sp.has("reverse") && sp.get("reverse") === "true") ||
    false;
  const show = props.data?.show || parseInt(sp.get("show") || "10");
  const from = props.data?.from || parseInt(sp.get("from") || "1");
  const results = props.data?.results;
  const validationError = props.data?.validationError;
  const formIds = props.state.formIds as Signal<string[]>;
  const searchComplete = props.data?.searchComplete || false;
  const patRequired = props.data?.patRequired || false;

  return (
    <>
      <SearchForm formIds={formIds}>
        <SearchBox
          prefix={prefix}
          start={start}
          end={end}
          limit={limit}
          validationError={validationError}
          patRequired={patRequired}
          reverse={reverse}
          formIds={formIds}
        />
        <SearchResults
          results={results}
          formIds={formIds}
          show={show}
          from={from}
          searchComplete={searchComplete}
        />
      </SearchForm>
    </>
  );
}
