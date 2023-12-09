import { useSignal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { Help } from "./Help.tsx";
import { KvUIEntry, Stats, ToastType } from "../types.ts";
import { StatsBar } from "../components/StatsBar.tsx";
import { submitSearchForm } from "../utils/ui/form.ts";
import { KvDialog } from "../components/dialogs/KvDialog.tsx";
import { JSX } from "preact";
import { DeleteDataDialog } from "../components/dialogs/DeleteDataDialog.tsx";
import { CopyDataDialog } from "../components/dialogs/CopyDataDialog.tsx";
import { Toast } from "./Toast.tsx";
import { DoubleRightIcon } from "../components/svg/DoubleRight.tsx";
import { SingleRightIcon } from "../components/svg/SingleRight.tsx";
import { SingleLeftIcon } from "../components/svg/SingleLeft.tsx";
import { DoubleLeftIcon } from "../components/svg/DoubleLeft.tsx";

interface SearchResultsProps {
  results: KvUIEntry[] | undefined;
  resultsCount: number;
  show: number;
  from: number;
  filter: string | undefined;
  filtered: boolean;
  searchComplete: boolean;
  stats?: Stats;
  session: string;
  prefix: string;
  start: string;
  end: string;
  reverse: boolean;
  connections: { name: string; id: string; env: string }[];
  connectionName: string;
  connectionId: string;
  connectionLocation: string;
}

export function SearchResults(props: SearchResultsProps) {
  const { results, resultsCount, filter, filtered } = props;
  const { prefix, start, end, reverse, session } = props;
  const entries = filtered ? " filtered entries" : " entries";

  const fullViewKey = useSignal("");
  const fullViewValue = useSignal("");
  const fullViewKeyHash = useSignal("");
  const selected = useSignal<string[]>([]);
  const showToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("info");

  const to = Math.min(props.from + props.show - 1, resultsCount);

  if (IS_BROWSER && (new URL(window.location.href)).searchParams.has("prefix") && !results) {
    // FIXME: Seems brittle
    // GET request with POST data in URL, so submit form to redirect to POST
    setTimeout(() => {
      submitSearchForm();
    }, 0);
  }

  function onShowChange() {
    const from = document.getElementById("from") as HTMLInputElement;
    from.value = "1";
    submitSearchForm();
  }

  function applyFilter() {
    const from = document.getElementById("from") as HTMLInputElement;
    from.value = "1";
    submitSearchForm();
  }

  function clearFilter() {
    const filter = document.getElementById("filter") as HTMLInputElement;
    filter.value = "";
    submitSearchForm();
  }

  function page(forward: boolean) {
    const newFrom = forward ? props.from + props.show : props.from - props.show;
    if (newFrom > resultsCount) {
      return;
    }

    const from = document.getElementById("from") as HTMLInputElement;
    from.value = newFrom < 1 ? "1" : newFrom.toString();
    submitSearchForm();
  }

  function firstPage() {
    const from = document.getElementById("from") as HTMLInputElement;
    from.value = "1";
    submitSearchForm();
  }

  function lastPage() {
    let newFrom = props.from;
    while (newFrom + props.show < resultsCount) {
      newFrom += props.show;
    }
    const from = document.getElementById("from") as HTMLInputElement;
    from.value = newFrom.toString();
    submitSearchForm();
  }

  function fullView(event: JSX.TargetedEvent<HTMLTableRowElement, MouseEvent>) {
    const target = event.target as HTMLElement;
    if (target.tagName === "TD") {
      const key = target.parentElement!.children[1].textContent;
      const value = (target.parentElement!.children[2] as HTMLTableCellElement).title;
      const keyHash = target.parentElement!.id;
      fullViewKey.value = key || "";
      fullViewValue.value = value || "";
      fullViewKeyHash.value = keyHash || "";

      const dialog = document.getElementById("kvDialog") as HTMLDialogElement;
      dialog.showModal();
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
        selected.value = results!.map((result) => result.keyHash);
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

  function scopeText() {
    if (selected.value.length > 0) {
      return selected.value.length + " selected";
    }
    return resultsCount + (filtered ? " filtered" : " results");
  }

  function deleteEntries(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const dialog = document.getElementById("deleteDialog") as HTMLDialogElement;
    dialog.showModal();
  }

  function copyEntries(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const dialog = document.getElementById("copyDialog") as HTMLDialogElement;
    dialog.showModal();
  }

  return (
    <div>
      {(resultsCount > 0 || filtered) &&
        (
          <div
            id="resultsPanel"
            class="mt-4 border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3"
          >
            <div class="flex justify-between">
              <div class="flex items-center justify-start mt-3">
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
                      retrieved by the search, not the entire KV database.
                    </p>
                  </div>
                </Help>
                <button type="button" onClick={clearFilter} class="btn btn-secondary btn-sm mx-3">
                  Clear
                </button>
                <button type="button" onClick={applyFilter} class="btn btn-primary btn-sm">Apply</button>
              </div>
              <div class="flex items-center justify-start mt-3">
                <button type="button" onClick={deleteEntries} class="btn btn-primary btn-sm mr-3">
                  Delete {scopeText()}
                </button>
                <button type="button" onClick={copyEntries} class="btn btn-primary btn-sm">
                  Copy {scopeText()}
                </button>
              </div>
            </div>
            <div class="w-full inline-block shadow border-1 border-gray-300 rounded-lg overflow-hidden mt-2">
              <table class="table table-zebra table-sm table-pin-rows table-pin-cols">
                <thead>
                  <tr>
                    <th class="w-12 text-center">
                      <input
                        id="selectAll"
                        type="checkbox"
                        onChange={handleSelectAll}
                        name="selectAll"
                        class="checkbox checkbox-xs checkbox-primary w-4 h-4"
                      />
                    </th>
                    <th class="text-accent text-base">Key</th>
                    <th class="text-accent text-base">Value</th>
                  </tr>
                </thead>
                <tbody id="resultRows">
                  {results!.map((result) => {
                    return (
                      <tr id={result.keyHash} class="hover" onClick={fullView}>
                        <td class="w-12 text-center">
                          <input
                            type="checkbox"
                            name={result.keyHash}
                            onChange={handleSelectRow}
                            class="checkbox checkbox-xs checkbox-primary w-4 h-4"
                          />
                        </td>
                        <td>{result.key}</td>
                        <td title={result.fullValue}>
                          {result.value}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div class="flex justify-between items-center">
                <div>
                  Show
                  <select
                    id="show"
                    form="pageForm"
                    name="show"
                    onChange={onShowChange}
                    class="rounded text-[#353535] mx-2 p-2 my-2"
                  >
                    <option value="10" selected={props.show === 10}>10</option>
                    <option value="20" selected={props.show === 20}>20</option>
                    <option value="50" selected={props.show === 50}>50</option>
                    <option value="100" selected={props.show === 100}>100</option>
                    <option value="200" selected={props.show === 200}>200</option>
                    <option value="500" selected={props.show === 500}>500</option>
                  </select>
                  entries
                </div>
                <div class="flex items-center gap-x-2">
                  Showing {props.from} to {to} of{" "}
                  {props.searchComplete ? resultsCount + entries : " many"}
                  <input id="from" name="from" type="hidden" form="pageForm" value={props.from} />
                  <button
                    class="btn btn-primary btn-sm"
                    onClick={firstPage}
                    disabled={props.from === 1}
                  >
                    <DoubleLeftIcon />
                  </button>
                  <button
                    class="btn btn-primary btn-sm"
                    onClick={() => page(false)}
                    disabled={props.from === 1}
                  >
                    <SingleLeftIcon />
                  </button>
                  <button
                    class="btn btn-primary btn-sm"
                    onClick={() => page(true)}
                    disabled={props.from + props.show > resultsCount}
                  >
                    <SingleRightIcon />
                  </button>
                  <button
                    class="btn btn-primary btn-sm"
                    onClick={lastPage}
                    disabled={props.from + props.show > resultsCount}
                  >
                    <DoubleRightIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      {props.stats && <StatsBar stats={props.stats} />}
      <KvDialog
        kvKey={fullViewKey}
        kvValue={fullViewValue}
        kvKeyHash={fullViewKeyHash}
        connectionId={props.connectionId}
        prefix={prefix}
        start={start}
        end={end}
        from={props.from}
        show={props.show}
        reverse={reverse}
        showToastSignal={showToastSignal}
        toastMsg={toastMsg}
        toastType={toastType}
      />
      <DeleteDataDialog
        keysSelected={selected.value}
        connections={props.connections}
        connectionLocation={props.connectionLocation}
        connectionId={props.connectionId}
        prefix={prefix}
        start={start}
        end={end}
        from={props.from}
        show={props.show}
        resultsCount={resultsCount}
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
        from={props.from}
        show={props.show}
        resultsCount={resultsCount}
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
