import { computed, useSignal } from "@preact/signals";
import { JSX } from "preact";
import { StatsBar } from "../../components/StatsBar.tsx";
import { CopyDataDialog } from "../../components/dialogs/CopyDataDialog.tsx";
import { DeleteDataDialog } from "../../components/dialogs/DeleteDataDialog.tsx";
import { DoubleLeftIcon } from "../../components/svg/DoubleLeft.tsx";
import { DoubleRightIcon } from "../../components/svg/DoubleRight.tsx";
import { SingleLeftIcon } from "../../components/svg/SingleLeft.tsx";
import { SingleRightIcon } from "../../components/svg/SingleRight.tsx";
import { ListAPIResponseData } from "../../routes/api/list.tsx";
import { Environment, KvUIEntry, Stats, ToastType } from "../../types.ts";
import { EntryEditor } from "../EntryEditor.tsx";
import { Help } from "../Help.tsx";
import { Toast } from "../Toast.tsx";
import { updateListUrl } from "../../utils/ui/form.ts";
import { freshImports } from "$fresh/src/dev/imports.ts";

interface ListResultsProps {
  results: KvUIEntry[] | undefined;
  resultsCount: number;
  show: number;
  from: number;
  filter: string | undefined;
  filtered: boolean;
  listComplete: boolean;
  stats?: Stats;
  session: string;
  prefix: string;
  start: string;
  end: string;
  reverse: boolean;
  connections: { name: string; id: string; env: Environment }[];
  connectionName: string;
  connectionId: string;
  connectionLocation: string;
}

const valueTypeColorMap: Record<string, string> = {
  string: "border-green-500 text-green-500",
  number: "border-blue-400 text-blue-400",
  boolean: "border-pink-400 text-pink-400",
  Array: "border-amber-500 text-amber-500",
  object: "border-purple-400 text-purple-400",
  null: "border-warm-gray-500 text-warm-gray-500",
  undefined: "border-blue-gray-500 text-blue-gray-500",
  bigint: "border-violet-400 text-violet-400",
  symbol: "border-rose-400 text-rose-400",
  function: "border-lime-500 text-lime-500",
  Date: "border-emerald-500 text-emerald-500",
  RegExp: "border-teal-500 text-teal-500",
  error: "border-red-400 text-red-400",
  unknown: "border-gray-300 text-gray-300",
  Map: "border-cyan-500 text-cyan-500",
  Set: "border-indigo-400 text-indigo-400",
  KvU64: "border-orange-500 text-orange-500",
  Uint8Array: "border-fuchsia-400 text-fuchsia-400",
};

export function valueTypeColor(type: string): string {
  return valueTypeColorMap[type] ?? "border-gray-500 text-gray-500";
}

export function ListResults(props: ListResultsProps) {
  const { results, resultsCount, filter, filtered } = props;
  const { prefix, start, end, reverse, session } = props;
  const entries = filtered ? " filtered entries" : " entries";

  const resultsSignal = useSignal(results);
  const resultsCountSignal = useSignal(resultsCount);
  const filteredSignal = useSignal(filtered);
  const fullViewKey = useSignal("");
  const fullViewValue = useSignal("");
  const fullViewKeyHash = useSignal("");
  const fullViewValueType = useSignal("");
  const selected = useSignal<string[]>([]);
  const showToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("info");
  const shouldShowResults = useSignal(true);
  const from = useSignal(props.from);
  const show = useSignal(props.show);
  const listCompleteSignal = useSignal(props.listComplete);
  const statsSignal = useSignal<Stats | undefined>(props.stats);

  const to = computed(() => {
    return Math.min(from.value + show.value - 1, resultsCountSignal.value);
  });

  function fetchResults() {
    updateListUrl();
    const form = document.getElementById("pageForm") as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("from", from.value.toString());
    formData.set("show", show.value.toString());
    formData.append("connectionId", props.connectionId);
    fetch("/api/list", {
      method: "POST",
      body: formData,
    }).then((response) => response.json())
      .then((data) => {
        const newData: ListAPIResponseData = data;
        if (newData.results) {
          resultsSignal.value = newData.results;
          resultsCountSignal.value = newData.fullResultsCount;
          filteredSignal.value = newData.filtered;
          listCompleteSignal.value = newData.listComplete;
          statsSignal.value = newData.stats;
          shouldShowResults.value = true;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function onShowChange() {
    from.value = 1;
    show.value = parseInt((document.getElementById("show") as HTMLSelectElement).value);
    fetchResults();
  }

  function applyFilter() {
    from.value = 1;
    fetchResults();
  }

  function clearFilter() {
    const filter = document.getElementById("filter") as HTMLInputElement;
    filter.value = "";
    fetchResults();
  }

  function page(forward: boolean, event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const newFrom = forward ? from.value + show.value : from.value - show.value;
    if (newFrom > resultsCountSignal.value) {
      return;
    }
    from.value = newFrom < 1 ? 1 : newFrom;
    fetchResults();
  }

  function firstPage(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    from.value = 1;
    fetchResults();
  }

  function lastPage(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    let newFrom = from.value;
    while (newFrom + show.value < resultsCountSignal.value) {
      newFrom += show.value;
    }
    from.value = newFrom;
    fetchResults();
  }

  function fullView(event: JSX.TargetedEvent<HTMLTableRowElement, MouseEvent>) {
    const target = event.target as HTMLElement;
    if (target.tagName === "TD") {
      const key = target.parentElement!.children[1].textContent;
      const value = (target.parentElement!.children[2] as HTMLTableCellElement).title;
      const valueType = (target.parentElement!.children[3] as HTMLTableCellElement).title;
      const keyHash = target.parentElement!.id;
      fullViewKey.value = key || "";
      fullViewValue.value = value || "";
      fullViewKeyHash.value = keyHash || "";
      fullViewValueType.value = valueType || "";

      const dialog = document.getElementById("kvDialog") as HTMLDialogElement;
      dialog.showModal();
      dialog.classList.add("modal");
      const okButtonRef = document.getElementById("okButton") as HTMLButtonElement;
      if (okButtonRef) {
        okButtonRef.focus();
      }
    }
  }

  function handleSelectRow(event: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const target = event.target as HTMLInputElement;
    if (target) {
      const rowKey = target.name;

      if (target.checked) {
        selected.value = [...selected.value, rowKey];
      } else {
        selected.value = selected.value.filter((key) => key !== rowKey);
      }
    }
  }

  function handleSelectAll(event: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const target = event.target as HTMLInputElement;
    if (target) {
      const checkboxes = document.querySelectorAll("#resultRows input[type='checkbox']");
      if (target.checked) {
        selected.value = resultsSignal.value!.map((result) => result.keyHash);
        checkboxes.forEach((checkbox) => {
          (checkbox as HTMLInputElement).checked = true;
        });
      } else {
        selected.value = [];
        checkboxes.forEach((checkbox) => {
          (checkbox as HTMLInputElement).checked = false;
        });
      }
    }
  }

  //TODO doe this need to be computed as well?
  function scopeText() {
    if (selected.value.length > 0) {
      return selected.value.length + " selected";
    }
    return resultsCountSignal.value + (filteredSignal.value ? " filtered" : " results");
  }

  function deleteEntries(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const dialog = document.getElementById("deleteDialog") as HTMLDialogElement;
    dialog.showModal();
    dialog.classList.add("modal");
  }

  function copyEntries(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const dialog = document.getElementById("copyDialog") as HTMLDialogElement;
    dialog.showModal();
    dialog.classList.add("modal");
  }

  return (
    <div>
      {shouldShowResults.value && (resultsCountSignal.value > 0 || filteredSignal.value) &&
        (
          <div
            id="resultsPanel"
            class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-4"
          >
            <div class="flex justify-between">
              <div class="flex items-center justify-start">
                <label for="filter">Filter</label>
                <input
                  type="text"
                  id="filter"
                  name="filter"
                  form="pageForm"
                  class="input input-bordered input-primary ml-2 p-2 my-2"
                  value={filter}
                />
                <Help dialogId="filterHelp" dialogTitle="Filter">
                  <div>
                    <p>
                      Free text search of key and values. Filtering only applies to the KV entries
                      retrieved by the list operation, not the entire KV database.
                    </p>
                  </div>
                </Help>
                <button type="button" onClick={clearFilter} class="btn btn-secondary btn-sm mx-3">
                  Clear
                </button>
                <button type="button" onClick={applyFilter} class="btn btn-primary btn-sm">
                  Apply
                </button>
              </div>
              <div class="flex items-center justify-start">
                <button type="button" onClick={deleteEntries} class="btn btn-primary btn-sm mr-3">
                  Delete {scopeText()}
                </button>
                <button type="button" onClick={copyEntries} class="btn btn-primary btn-sm">
                  Copy {scopeText()}
                </button>
              </div>
            </div>
            <div class="mt-3">
              <table class="table table-sm table-pin-rows table-pin-cols border border-[#151515]">
                <thead>
                  <tr>
                    <th class="w-12 text-center bg-gray-700 shadow-lg">
                      <input
                        id="selectAll"
                        type="checkbox"
                        onChange={handleSelectAll}
                        aria-label="Select all rows"
                        name="selectAll"
                        class="checkbox checkbox-xs checkbox-primary w-4 h-4"
                      />
                    </th>
                    <th class="text-[#d5d5d5] text-base bg-gray-700">Key</th>
                    <th class="text-[#d5d5d5] text-base bg-gray-700">Value</th>
                    <th class="text-[#d5d5d5] text-base bg-gray-700">Value Type</th>
                  </tr>
                </thead>
                <tbody id="resultRows">
                  {resultsSignal.value!.map((result) => {
                    return (
                      <tr id={result.keyHash} class="hover" onClick={fullView}>
                        <td class="w-12 text-center">
                          <input
                            type="checkbox"
                            name={result.keyHash}
                            aria-label="Select row"
                            onChange={handleSelectRow}
                            class="checkbox checkbox-xs checkbox-primary w-4 h-4"
                          />
                        </td>
                        <td>{result.key}</td>
                        <td title={result.fullValue} class="break-all">
                          {result.value}
                        </td>
                        <td title={result.valueType}>
                          <div class={"badge badge-outline " + valueTypeColor(result.valueType)}>
                            {result.valueType}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div class="flex justify-between items-center mt-2">
                <div>
                  Show
                  <select
                    id="show"
                    form="pageForm"
                    name="show"
                    aria-label="Number of entries to show"
                    onChange={onShowChange}
                    class="select select-primary select-sm mx-2"
                  >
                    <option value="10" selected={show.value === 10}>10</option>
                    <option value="20" selected={show.value === 20}>20</option>
                    <option value="50" selected={show.value === 50}>50</option>
                    <option value="100" selected={show.value === 100}>100</option>
                    <option value="200" selected={show.value === 200}>200</option>
                    <option value="500" selected={show.value === 500}>500</option>
                  </select>
                  entries
                </div>
                <div class="flex items-center gap-x-2">
                  Showing {from.value} to {to.value} of{" "}
                  {listCompleteSignal.value ? resultsCountSignal.value + entries : " many"}
                  <input id="from" name="from" type="hidden" form="pageForm" value={from.value} />
                  <button
                    class="btn btn-primary btn-sm"
                    onClick={firstPage}
                    f-partial="/list"
                    aria-label="First page"
                    disabled={from.value === 1}
                  >
                    <DoubleLeftIcon />
                  </button>
                  <button
                    class="btn btn-primary btn-sm"
                    onClick={(e) => page(false, e)}
                    f-partial="/list"
                    aria-label="Previous page"
                    disabled={from.value === 1}
                  >
                    <SingleLeftIcon />
                  </button>
                  <button
                    class="btn btn-primary btn-sm"
                    onClick={(e) => page(true, e)}
                    f-partial="/list"
                    aria-label="Next page"
                    disabled={from.value + show.value > resultsCountSignal.value}
                  >
                    <SingleRightIcon />
                  </button>
                  <button
                    class="btn btn-primary btn-sm"
                    onClick={lastPage}
                    f-partial="/list"
                    aria-label="Last page"
                    disabled={from.value + show.value > resultsCountSignal.value}
                  >
                    <DoubleRightIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      {statsSignal.value && <StatsBar stats={statsSignal.value} />}

      <EntryEditor
        kvKey={fullViewKey}
        kvValue={fullViewValue}
        kvKeyHash={fullViewKeyHash}
        kvValueType={fullViewValueType}
        connectionId={props.connectionId}
        showToastSignal={showToastSignal}
        toastMsg={toastMsg}
        toastType={toastType}
        shouldShowResults={shouldShowResults}
      />
      <DeleteDataDialog
        keysSelected={selected.value}
        connections={props.connections}
        connectionLocation={props.connectionLocation}
        connectionId={props.connectionId}
        prefix={prefix}
        start={start}
        end={end}
        from={from.value}
        show={show.value}
        resultsCount={resultsCountSignal.value}
        reverse={reverse}
        filter={filter}
      />
      <CopyDataDialog
        keysSelected={selected.value}
        connections={props.connections}
        connectionLocation={props.connectionLocation}
        connectionId={props.connectionId}
        prefix={prefix}
        start={start}
        end={end}
        from={from.value}
        show={show.value}
        resultsCount={resultsCountSignal.value}
        reverse={reverse}
        filter={filter}
      />
      <Toast
        id="actionCompletedToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </div>
  );
}
