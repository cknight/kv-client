import { signal, useSignal } from "@preact/signals";
import {
  BUTTON,
  TW_TABLE,
  TW_TABLE_WRAPPER,
  TW_TBODY,
  TW_TD,
  TW_TH,
  TW_THEAD,
  TW_TR,
} from "../consts.ts";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { Help } from "../components/Help.tsx";
import { KvUIEntry, Stats } from "../types.ts";
import { StatsBar } from "../components/StatsBar.tsx";
import { submitSearchForm } from "../utils/ui/form.ts";
import { KvDialog } from "../components/dialogs/KvDialog.tsx";
import { JSX } from "preact";
import { DeleteDataDialog } from "../components/dialogs/DeleteDataDialog.tsx";
import { CopyDataDialog } from "../components/dialogs/CopyDataDialog.tsx";

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
  connections: {name: string, id: string, env:string }[];
  connectionName: string;
  connectionId: string;
  connectionLocation: string;
}

export function SearchResults(props: SearchResultsProps) {
  const { results, resultsCount, filter, filtered } = props;
  const { prefix, start, end, reverse, session } = props;
  const entries = filtered ? " filtered entries" : " entries";

  const fullViewKey = signal("");
  const fullViewValue = signal("");
  const selected = useSignal<string[]>([]);

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
      fullViewKey.value = key || "";
      fullViewValue.value = value || "";

      const dialog = document.getElementById("kvDialog") as HTMLDialogElement;
      dialog.showModal();
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
          <>
            <div class="flex justify-between">
              <div class="flex items-center justify-start mt-3">
                <label for="filter">Filter</label>
                <input
                  type="text"
                  id="filter"
                  name="filter"
                  form="pageForm"
                  class="rounded bg-blue-100 ml-2 p-2 my-2"
                  value={filter}
                />
                <Help dialogId="filterHelp" dialogTitle="Filter">
                  <div>
                    <p>
                      Free text search of key and values. Both keys are values are converted to
                      strings prior to filtering, using{" "}
                      <span class="font-mono bg-gray-200 rounded p-1">JSON.stringify()</span>. Only
                      entries which contain the exact filter substring within the{" "}
                      <span class="font-mono bg-gray-200 rounded p-1">JSON.stringify()</span>
                      string (in either the key or value) are included.
                    </p>
                    <p class="mt-2">
                      <span class="font-bold">NOTE:</span>{" "}
                      Filtering only applies to the rows retrieved by the search, not the entire KV
                      database.
                    </p>
                  </div>
                </Help>
                <button type="button" onClick={clearFilter} class={BUTTON}>Clear</button>
                <button type="button" onClick={applyFilter} class={BUTTON}>Apply</button>
              </div>
              <div class="flex items-center justify-start mt-3">
                <button type="button" onClick={deleteEntries} class={BUTTON}>
                  Delete {scopeText()}
                </button>
                <button type="button" onClick={copyEntries} class={BUTTON}>
                  Copy {scopeText()}
                </button>
              </div>
            </div>
            <div class={TW_TABLE_WRAPPER}>
              <table class={TW_TABLE}>
                <thead class={TW_THEAD}>
                  <tr>
                    <th class={TW_TH + " w-12"}>
                      <input
                        id="selectAll"
                        type="checkbox"
                        onChange={handleSelectAll}
                        name="selectAll"
                        class="w-4 h-4"
                      />
                    </th>
                    <th class={TW_TH}>Key</th>
                    <th class={TW_TH}>Value</th>
                  </tr>
                </thead>
                <tbody class={TW_TBODY} id="resultRows">
                  {results!.map((result) => {
                    return (
                      <tr class={TW_TR} onClick={fullView}>
                        <td class={TW_TD + " w-12 text-center"}>
                          <input
                            type="checkbox"
                            name={result.keyHash}
                            onChange={handleSelectRow}
                            class="w-4 h-4"
                          />
                        </td>
                        <td class={TW_TD}>{result.key}</td>
                        <td class={TW_TD} title={result.fullValue}>
                          {result.value}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div class="flex justify-between">
                <div>
                  Show
                  <select
                    id="show"
                    form="pageForm"
                    name="show"
                    onChange={onShowChange}
                    class="rounded bg-blue-100 mx-2 p-2 my-2"
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
                <div>
                  Showing {props.from} to {to} of{" "}
                  {props.searchComplete ? resultsCount + entries : " many"}
                  <input id="from" name="from" type="hidden" form="pageForm" value={props.from} />
                  <button class={BUTTON} onClick={firstPage} disabled={props.from === 1}>
                    &lt;&lt;
                  </button>
                  <button class={BUTTON} onClick={() => page(false)} disabled={props.from === 1}>
                    &lt;
                  </button>
                  <button
                    class={BUTTON}
                    onClick={() => page(true)}
                    disabled={props.from + props.show > resultsCount}
                  >
                    &gt;
                  </button>
                  <button
                    class={BUTTON}
                    onClick={lastPage}
                    disabled={props.from + props.show > resultsCount}
                  >
                    &gt;&gt;
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      {props.stats && <StatsBar stats={props.stats} />}
      <KvDialog kvKey={fullViewKey} kvValue={fullViewValue} />
      <DeleteDataDialog
        keysSelected={selected.value}
        connectionName={props.connectionName}
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
        connectionName={props.connectionName}
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

    </div>
  );
}
