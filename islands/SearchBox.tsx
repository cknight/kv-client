import { useSignal } from "@preact/signals";
import { SearchData } from "../types.ts";
import { KvKeyInput } from "../components/KvKeyInput.tsx";
import { useRef } from "preact/hooks";

export function SearchBox(data: SearchData) {
  const prefix = data.prefix;
  const start = data.start;
  const end = data.end;
  const limit = data.limit;
  const reverse = data.reverse;
  const kvUrl = data.kvUrl;
  const pat = data.pat;
  const results = data.results;

  return (
    <form method="post" class="w-full m-8 border-1 border-gray-400 rounded p-5 bg-white">
      <div class="flex mb-2">
        <div class="w-full mr-4 flex items-center">
          <label for="kvUrl" class="w-24">KV location</label>
          <input id="kvUrl" type="text" name="kvUrl" class="rounded bg-blue-100 w-full ml-2 p-2" value={kvUrl}/>
        </div>
        <div class="flex items-center mr-[13px]">
          <label for="pat">PAT</label>
          <input id="pat" type="password" name="pat" class="rounded bg-blue-100 w-full ml-2 p-2" value={pat}/>
        </div>
      </div>

      <div class="flex">
        <div class="w-2/3">
          <div class="w-full flex items-center">
            <label for="prefix" class="w-24">Prefix</label>
            <KvKeyInput id="prefix" type="text" name="prefix" class="rounded bg-blue-100 w-full p-2" value={prefix}/>
          </div>
          <div class="w-full flex items-center">
            <label for="start" class="w-24">Start</label>
            <KvKeyInput id="start" type="text" name="start" class="rounded bg-blue-100 w-full p-2" value={start}/>
          </div>
          <div class="w-full flex items-center">
            <label for="end" class="w-24">End</label>
            <KvKeyInput id="end" type="text" name="end" class="rounded bg-blue-100 w-full p-2" value={end}/>
          </div>
        </div>
        <div class="w-1/3 pb-1">
          <div class="flex items-center justify-end mr-[13px]">
            <label for="limit" class="w-24">Limit</label>
            <select id="limit" name="limit" class="rounded bg-blue-100 w-24 p-2 my-2">
              <option value="10" selected={limit === "10"}>10</option>
              <option value="50" selected={limit === "50"}>50</option>
              <option value="100" selected={limit === "100"}>100</option>
              <option value="200" selected={limit === "200"}>200</option>
              <option value="500" selected={limit === "500"}>500</option>
              <option value="1000" selected={limit === "1000"}>1000</option>
              <option value="all" selected={limit === "all"}>All</option>
            </select>
          </div>
          <div class="w-full flex items-center justify-end mt-5">
            <label for="reverse" class="w-24">Reverse</label>
            <input id="reverse" type="checkbox" name="reverse" class="mr-12 w-4 h-4" checked={reverse}/>
          </div>
        </div>
      </div>

      <div class="flex w-full justify-center mt-4">
        <button type="submit" class="px-2 py-1 rounded mx-4 bg-[#ff6b6b]">Reset</button>
        <button type="submit" class="px-2 py-1 rounded mx-4 bg-[#6b6bff]">Search</button>
        <button type="submit" class="px-2 py-1 rounded mx-4 bg-[#6b6bff]">Delete</button>
      </div>
    </form>
  );
}