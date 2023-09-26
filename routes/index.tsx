/// <reference lib="deno.unstable" />
import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { ValidationError } from "../utils/validationError.ts";
import { KvKeyInput } from "../components/KvKeyInput.tsx";
import { parseKvKey } from "../utils/kvKeyParser.ts";
import DarkMode from "../islands/DarkMode.tsx";
import { useSignal } from "@preact/signals";
import { KvEntry, SearchData, State, TW_TABLE, TW_TBODY, TW_TH, TW_THEAD, TW_TR } from "../types.ts";
import { SearchBox } from "../islands/SearchBox.tsx";
import { state } from "../utils/state.ts";
import { TabBar } from "../islands/TabBar.tsx";


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
export default function Home(data: PageProps<SearchData>) {
  const prefix = data.data?.prefix || "";
  const start = data.data?.start || "";
  const end = data.data?.end || "";
  const limit = data.data?.limit || "";
  const reverse = data.data?.reverse || false;
  const kvUrl = data.data?.kvUrl || "";
  const pat = data.data?.pat || "";
  const results = data.data?.results || [];
  
  return (
    <>
      <Head>
      </Head>
      <div class="bg-[#f3f3f3] px-4 py-4 mx-auto">
        <div class="flex items-center">
          <label for="connection" class="w-24 font-bold">Connection:</label>
          <select id="connection" name="connection" class="rounded bg-blue-100 w-24 mx-2 p-2">
            <option disabled value="">Create a connection </option>
          </select>
          <svg height="25" width="25" viewBox="0 0 128 128"><path d="M64,0a64,64,0,1,0,64,64A64.07,64.07,0,0,0,64,0Zm0,122a58,58,0,1,1,58-58A58.07,58.07,0,0,1,64,122Z"/><path d="M90,61H67V38a3,3,0,0,0-6,0V61H38a3,3,0,0,0,0,6H61V90a3,3,0,0,0,6,0V67H90a3,3,0,0,0,0-6Z"/></svg>
        </div>

        <div class="mx-auto flex flex-col items-center justify-center">
          <h1 class="text-4xl font-bold">KV Explorer</h1>
          <TabBar tab="search"/>
          <SearchBox kvUrl={kvUrl} pat={pat} prefix={prefix} 
              start={start} end={end} limit={limit} reverse={reverse} results={results}/>
          {data.data?.validationError && 
            <p class="text-2xl text-red-500">{data.data?.validationError}</p>
          }
          { results.length > 0 && <div class="inline-block shadow rounded-lg overflow-hidden mt-2">
            <table class={TW_TABLE}>
              <thead class={TW_THEAD}>
                <tr>
                  <th class={TW_TH}>
                    <input id="selectAll" type="checkbox" name="selectAll" class="mr-12 w-4 h-4"/>
                  </th>
                  <th class={TW_TH}>Key</th>
                  <th class={TW_TH}>Value</th>
                </tr>
              </thead>
              <tbody class={TW_TBODY}>
                {results.map((result) => {
                  return (
                    <tr>
                      <td class={TW_TR}>
                        <input id="selectAll" type="checkbox" name="selectAll" class="mr-12 w-4 h-4"/>
                      </td>
                      <td class={TW_TR}>{result.key}</td>
                      <td class={TW_TR}>{result.value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>}
        </div>
      </div>
    </>
  );
}

