import { Handlers, PageProps } from "$fresh/server.ts";
import { signal } from "@preact/signals";
import { SearchBox } from "../islands/SearchBox.tsx";
import { CONNECTIONS_KEY_PREFIX, KvConnection, KvEntry, SearchData } from "../types.ts";
import { parseKvKey } from "../utils/kvKeyParser.ts";
import { ValidationError } from "../utils/validationError.ts";
import { SearchResults } from "../islands/SearchResults.tsx";
import { searchKv } from "../utils/kvSearch.ts";

let stateKv: Deno.Kv;

async function establishKvConnection(connection: string, pat: string) {
  const kvLocal = await Deno.openKv();
  const conn = await kvLocal.get<KvConnection>([CONNECTIONS_KEY_PREFIX, connection]);
  const location = conn.value?.kvLocation || "<unknown>";

  if (location.startsWith("http")) {
      // Remote KV access
      if (pat.length < 20) {
        console.error("Invalid Personal Access Token (PAT) detected");
        throw new ValidationError("Invalid Personal Access Token (PAT).  If necessary, visit https://dash.deno.com/account#access-tokens to create a new PAT");
      }
      Deno.env.set("DENO_KV_ACCESS_TOKEN", pat);
      stateKv = await Deno.openKv(location);
  } else {
      // Local KV file
      try {
        // Check if the file exists (and if it does we assume it is a valid KV file)
        await Deno.lstat(location);
      } catch (e) {
        console.error(`${location} does not exist`);
        throw new ValidationError(`${location} does not exist`);
      }
      stateKv = await Deno.openKv(location);
    } 

    console.log(`Established KV connection to ${location}`);
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const prefix = form.get("prefix")?.toString() || "";
    const start = form.get("start")?.toString() || "";
    const end = form.get("end")?.toString() || "";
    const limit = form.get("limit")?.toString() || "";
    const reverse = form.get("reverse")?.toString() === "true";
    const connection = form.get("kvConnection")?.toString() || "";
    let failReason;
    const results: KvEntry[] = [];

    try {
      await establishKvConnection(connection, "");
      results.push(...await searchKv({kv: stateKv!, prefix, start, end, limit, reverse}));
    } catch (e) {
      failReason = e.message || "Unknown error occurred";
      console.error(e);
    }
    console.log("Found ", results.length, " results");
    return await ctx.render({prefix, start, end, limit, reverse, results, validationError: failReason});
  }
}

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
      <SearchBox prefix={prefix} start={start} end={end} limit={limit} reverse={reverse}/>
      <SearchResults results={results} validationError={validationError}/>
    </>
  )
}
