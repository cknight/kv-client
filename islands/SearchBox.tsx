import { Signal } from "@preact/signals";
import { KvKeyInput } from "../components/KvKeyInput.tsx";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { PATDialog } from "../components/dialogs/PATDialog.tsx";
import { Help } from "../components/Help.tsx";
import { LINK } from "../consts.ts";
import { KeyHelp } from "../components/KeyHelp.tsx";
import { JSX } from "preact";
import { clearSearchForm, submitSearchForm } from "../utils/form.ts";

interface SearchDataProps {
  prefix: string;
  start: string;
  end: string;
  validationError?: string;
  limit: string;
  reverse: boolean;
}

export function SearchBox(data: SearchDataProps) {
  const prefix = data.prefix;
  const start = data.start;
  const end = data.end;
  const limit = data.limit;
  const reverse = data.reverse;
  const validationError = data.validationError;

  function resetForm(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    //event.preventDefault(); //e.g. don't submit the form
    clearSearchForm();
  }

  function submitForm(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    //event.preventDefault(); //e.g. don't submit the form
    const filter = document.getElementById("filter")! as HTMLInputElement;
    if (filter) {
      filter.value = "";
    }
    submitSearchForm();
  }

  return (
    <div>
      {validationError && <div class="text-red-500 w-full">{validationError}</div>}
      <div class="flex">
        <div class="w-2/3">
          <div class="w-full flex items-center">
            <label for="prefix" class="w-24">Prefix</label>
            <KvKeyInput
              id="prefix"
              form="pageForm"
              type="text"
              name="prefix"
              class="rounded bg-blue-100 w-full p-2"
              value={prefix}
            />
            <Help dialogId="prefixHelp" dialogTitle="Prefix key">
              <KeyHelp keyPart="prefix" />
            </Help>
          </div>
          <div class="w-full flex items-center">
            <label for="start" class="w-24">Start</label>
            <KvKeyInput
              id="start"
              form="pageForm"
              type="text"
              name="start"
              class="rounded bg-blue-100 w-full p-2"
              value={start}
            />
            <Help dialogId="startHelp" dialogTitle="Start key">
              <KeyHelp keyPart="start" />
            </Help>
          </div>
          <div class="w-full flex items-center">
            <label for="end" class="w-24">End</label>
            <KvKeyInput
              id="end"
              form="pageForm"
              type="text"
              name="end"
              class="rounded bg-blue-100 w-full p-2"
              value={end}
            />
            <Help dialogId="endHelp" dialogTitle="End key">
              <KeyHelp keyPart="end" />
            </Help>
          </div>
        </div>
        <div class="w-1/3">
          <div class="flex items-center justify-end mr-[13px] h-14">
            <label for="limit" class="w-24">Limit</label>
            <select
              id="limit"
              form="pageForm"
              name="limit"
              class="rounded bg-blue-100 w-24 p-2 my-2"
            >
              <option value="10" selected={limit === "10"}>10</option>
              <option value="20" selected={limit === "20"}>20</option>
              <option value="50" selected={limit === "50"}>50</option>
              <option value="100" selected={limit === "100"}>100</option>
              <option value="200" selected={limit === "200"}>200</option>
              <option value="500" selected={limit === "500"}>500</option>
              <option value="1000" selected={limit === "1000"}>1000</option>
              <option value="2000" selected={limit === "2000"}>2000</option>
              <option value="all" selected={limit === "all"}>All</option>
            </select>
            <Help dialogId="limitHelp" dialogTitle="Limit">
              <p>
                Set the maximum amount of key-value pairs to retrieve with this search. It is
                important to note that the subsequent actions of filtering or paging results is done
                within the context of the rows returned within this limit.
              </p>
            </Help>
          </div>
          <div class="w-full flex items-center justify-end mt-5">
            <label for="reverse" class="w-24">Reverse</label>
            <input
              id="reverse"
              form="pageForm"
              type="checkbox"
              name="reverse"
              class="mr-12 w-4 h-4"
              checked={reverse}
            />
            <Help dialogId="reverseHelp" dialogTitle="Reverse">
              <p>Return the key-value pairs in lexicographically descending order</p>
            </Help>
          </div>
        </div>
      </div>

      <div class="flex w-full justify-center mt-4">
        <button
          type="button"
          onClick={resetForm}
          form="pageForm"
          class="px-2 py-1 rounded mx-4 bg-[#ff6b6b]"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={submitForm}
          form="pageForm"
          class="px-2 py-1 rounded mx-4 bg-[#6b6bff]"
        >
          Search
        </button>
      </div>
    </div>
  );
}
