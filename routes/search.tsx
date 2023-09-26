import { Handlers, PageProps } from "$fresh/server.ts";
import { SearchBox } from "../islands/SearchBox.tsx";
import { KvEntry, SearchData } from "../types.ts";
import { parseKvKey } from "../utils/kvKeyParser.ts";
import { state } from "../utils/state.ts";
import { ValidationError } from "../utils/validationError.ts";

async function establishKvConnection(kvUrl: string, pat: string) {
  if (state.kv === null || state.kvUrl !== kvUrl || state.pat !== pat) {
    // DB inputs have changed, so we need to establish a new connection
    state.kv?.close();

    if (kvUrl.startsWith("http")) {
      // Remote KV access
      if (pat.length < 20) {
        console.error("Invalid Personal Access Token (PAT) detected");
        throw new ValidationError("Invalid Personal Access Token (PAT).  If necessary, visit https://dash.deno.com/account#access-tokens to create a new PAT");
      }
      Deno.env.set("DENO_KV_ACCESS_TOKEN", pat);
      state.kv = await Deno.openKv(kvUrl);
    } else if (kvUrl !== "") {
      // Local KV file
      try {
        // Check if the file exists (and if it does we assume it is a valid KV file)
        await Deno.lstat(kvUrl);
      } catch (e) {
        console.error(`${kvUrl} does not exist`);
        throw new ValidationError(`${kvUrl} does not exist`);
      }
      state.kv = await Deno.openKv(kvUrl);
    } else {
      console.error("No KV URL provided");
      throw new ValidationError("No KV remote URL or local file path provided");
    }

    state.kvUrl = kvUrl;
    state.pat = pat;
    console.log(`Established KV connection to ${kvUrl === "" ? "local" : kvUrl}`);
  } else {
    console.log(`Using existing KV connection to ${kvUrl === "" ? "local" : kvUrl}`);
  }
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const kvUrl = form.get("kvUrl")?.toString() || "";
    const pat = form.get("pat")?.toString() || "";
    const prefix = form.get("prefix")?.toString() || "";
    const start = form.get("start")?.toString() || "";
    const end = form.get("end")?.toString() || "";
    const limit = form.get("limit")?.toString() || "";
    const reverse = form.get("reverse")?.toString() === "true";
    let failReason;
    const results: KvEntry[] = [];

    try {
      await establishKvConnection(kvUrl, pat);
      const prefixKey = parseKvKey(prefix);
      const listIterator = state.kv!.list({prefix: prefixKey});
      const maxEntries = limit === "" ? 10 : parseInt(limit);
      let count = 0;

      for await (const entry of listIterator) {
        const value = JSON.stringify(entry.value);
        
        const displayValue = value.length > 180 ? value.slice(0, 180) + "..." : value;
        results.push({key: JSON.stringify(entry.key), value: displayValue, versionstamp: entry.versionstamp, fullValue: value});

        if (++count > maxEntries) {
          break;
        }
      }

    } catch (e) {
      failReason = e.message || "Unknown error occurred";
      console.error(e);
    }

    return await ctx.render({kvUrl, pat, prefix, start, end, limit, reverse, results, validationError: failReason});
  }
}

export default function Search(data: PageProps<SearchData>) {
  const prefix = data.data?.prefix || "";
  const start = data.data?.start || "";
  const end = data.data?.end || "";
  const limit = data.data?.limit || "";
  const reverse = data.data?.reverse || false;
  const kvUrl = data.data?.kvUrl || "";
  const pat = data.data?.pat || "";
  const results = data.data?.results || [];

  return (
    <SearchBox kvUrl={kvUrl} pat={pat} prefix={prefix} 
    start={start} end={end} limit={limit} reverse={reverse} results={results}/>
)
}
