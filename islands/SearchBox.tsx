import { Signal } from "@preact/signals";
import { KvKeyInput } from "../components/KvKeyInput.tsx";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { PATDialog } from "../components/PATDialog.tsx";
import { Help } from "../components/Help.tsx";
import { LINK } from "../consts.ts";
import { KeyHelp } from "../components/KeyHelp.tsx";
import { JSX } from "preact";

interface SearchDataProps {
  prefix: string;
  start: string;
  end: string;
  patRequired: boolean;
  validationError?: string;
  limit: string;
  reverse: boolean;
  formIds: Signal<string[]>;
}

export function SearchBox(data: SearchDataProps) {
  const prefix = data.prefix;
  const start = data.start;
  const end = data.end;
  const limit = data.limit;
  const reverse = data.reverse;
  const patRequired = data.patRequired;
  const validationError = data.validationError;

  // Add form ids to signal for access by SearchForm
  if (IS_BROWSER) {
    data.formIds.value.push("prefix", "start", "end", "limit", "reverse");

    if (patRequired) {
      setTimeout(() => {
        (document.getElementById("accessTokenDialog")! as HTMLDialogElement).showModal();
      }, 0);
    }
  }

  function resetForm(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    const connectionId = (document.getElementById("connection")! as HTMLSelectElement).value;
    (document.getElementById("pageForm")! as HTMLFormElement).reset();
    (document.getElementById("connection")! as HTMLSelectElement).value = connectionId;
  }

  return (
    <div>
      {validationError && !patRequired && <div class="text-red-500 w-full">{validationError}</div>}
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
              <KeyHelp keyPart="prefix"/>
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
              <KeyHelp keyPart="start"/>
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
              <KeyHelp keyPart="end"/>
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
              <p>Set the maximum amount of key-value pairs to retrieve with this search</p>
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
        <button type="button" onClick={resetForm} form="pageForm" class="px-2 py-1 rounded mx-4 bg-[#ff6b6b]">
          Reset
        </button>
        <button type="submit" form="pageForm" class="px-2 py-1 rounded mx-4 bg-[#6b6bff]">
          Search
        </button>
      </div>
      {patRequired && <PATDialog validationError={validationError} />}
    </div>
  );
}
