import { useSignal } from "@preact/signals";
import { JSX } from "preact";
import { KeyHelp } from "../../components/ListKeyHelp.tsx";
import { ToastType } from "../../types.ts";
import { clearListForm, submitListForm } from "../../utils/ui/form.ts";
import { Help } from "../Help.tsx";
import { Toast } from "../Toast.tsx";
import { KvKeyInput } from "../keyValue/KvKeyInput.tsx";

interface ListDataProps {
  prefix: string;
  start: string;
  end: string;
  validationError?: string;
  limit: string;
  reverse: boolean;
  disableCache: boolean;
}

export function ListCriteriaBox(data: ListDataProps) {
  const prefix = data.prefix;
  const start = data.start;
  const end = data.end;
  const limit = data.limit;
  const reverse = data.reverse;
  const validationError = data.validationError;
  const disableCache = data.disableCache;
  const showToastSignal = useSignal(data.validationError ? true : false);
  const toastMsg = useSignal(data.validationError || "");
  const toastType = useSignal<ToastType>("error");

  function resetForm(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    //event.preventDefault(); //e.g. don't submit the form
    clearListForm();
  }

  function submitForm(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    //event.preventDefault(); //e.g. don't submit the form
    document.body.style.cursor = "wait"; // Set the cursor to 'wait'

    const filter = document.getElementById("filter")! as HTMLInputElement;
    if (filter) {
      filter.value = "";
    }

    //if a new list operation is being done, reset the page to 1
    const from = document.getElementById("from")! as HTMLInputElement;
    if (from) {
      from.value = "1";
    }
    submitListForm();
  }

  return (
    <div class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3">
      <div class="flex w-full">
        <div class="w-2/3">
          <div class="w-full flex items-center">
            <label for="prefix" class="w-16 pb-3">Prefix</label>
            <div class="w-full">
              <KvKeyInput
                id="prefix"
                form="pageForm"
                type="text"
                name="prefix"
                class="input input-bordered input-primary w-full p-2"
                value={prefix}
              />
            </div>
            <div class="pb-3">
              <Help dialogId="prefixHelp" dialogTitle="Prefix key">
                <KeyHelp keyPart="prefix" />
              </Help>
            </div>
          </div>
          <div class="w-full flex items-center mt-2">
            <label for="start" class="w-16 pb-3">Start</label>
            <div class="w-full">
              <KvKeyInput
                id="start"
                form="pageForm"
                type="text"
                name="start"
                class="input input-bordered input-primary w-full p-2"
                value={start}
              />
            </div>
            <div class="pb-3">
              <Help dialogId="startHelp" dialogTitle="Start key">
                <KeyHelp keyPart="start" />
              </Help>
            </div>
          </div>
          <div class="w-full flex items-center mt-2">
            <label for="end" class="w-16 pb-3">End</label>
            <div class="w-full">
              <KvKeyInput
                id="end"
                form="pageForm"
                type="text"
                name="end"
                class="input input-bordered input-primary w-full p-2"
                value={end}
              />
            </div>
            <div class="pb-3">
              <Help dialogId="endHelp" dialogTitle="End key">
                <KeyHelp keyPart="end" />
              </Help>
            </div>
          </div>
        </div>
        <div class="w-1/3">
          <div class="flex items-center justify-end h-14 mt-2">
            <label for="limit" class="w-24">Limit</label>
            <select
              id="limit"
              form="pageForm"
              name="limit"
              class="select select-primary select-sm w-24 my-2 "
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
                This is the maximum number of KV entries to retrieve with this list operation.
                Paging and filtering are preformed against the rows retrieved within this limit.
              </p>
            </Help>
          </div>
          <div class="w-full flex items-center justify-end mt-5">
            <label for="reverse" class="w-24">Reverse</label>
            <div class="w-24 flex justify-center">
              <input
                id="reverse"
                form="pageForm"
                type="checkbox"
                name="reverse"
                class="checkbox checkbox-sm checkbox-primary w-4 h-4"
                checked={reverse}
              />
            </div>
            <Help dialogId="reverseHelp" dialogTitle="Reverse">
              <p>
                Return the key-value pairs in{" "}
                <a
                  href="https://docs.deno.com/deploy/kv/manual/key_space#key-part-ordering"
                  target="_blank"
                  class="link"
                >
                  lexicographically descending
                </a>{" "}
                order
              </p>
            </Help>
          </div>
          <div class="w-full flex items-center justify-end mt-5">
            <label for="disableCache" class="w-24">Disable cache</label>
            <div class="w-24 flex justify-center">
              <input
                id="disableCache"
                form="pageForm"
                type="checkbox"
                name="disableCache"
                class="checkbox checkbox-sm checkbox-primary w-4 h-4"
                checked={disableCache}
              />
            </div>
            <Help dialogId="disableCacheHelp" dialogTitle="Disable cache">
              <p>
                Do not use the KV Client server cache (populated from previous operations) when
                querying KV. Get all results direct from the KV store.
              </p>
            </Help>
          </div>
        </div>
      </div>

      <div class="flex w-full justify-center gap-x-4 mt-4">
        <button
          type="button"
          onClick={resetForm}
          form="pageForm"
          class="btn btn-secondary w-[72px]"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={submitForm}
          form="pageForm"
          class="btn btn-primary w-[72px]"
        >
          List
        </button>
      </div>
      <Toast
        id="listCriteriaToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </div>
  );
}
