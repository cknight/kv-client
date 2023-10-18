import { Signal } from "@preact/signals";
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
import { createKvUIEntry } from "../utils/utils.ts";
import { Help } from "../components/Help.tsx";

interface SearchResultsProps {
  results: Deno.KvEntry<unknown>[] | undefined;
  formIds: Signal<string[]>;
  show: number;
  from: number;
  filter: string | undefined;
  searchComplete: boolean;
}

export function SearchResults(props: SearchResultsProps) {
  const { results, filter } = props;
  let displayResults = results;
  let entries = " entries";

  if (filter) {
    displayResults = results?.filter((e) => keep(filter,e));
    if (filter.length > 0) {
      entries = " filtered entries";
    }
  }

  function keep(filter: string, entry: Deno.KvEntry<unknown>) {
    return JSON.stringify(entry.key).includes(filter) 
        || JSON.stringify(entry.value).includes(filter);
  }

  const resultsToShow = displayResults?.slice(props.from - 1, props.from -1 + props.show);
  const to = Math.min(props.from + props.show - 1, displayResults? displayResults.length : 0);

  // Add form ids to signal for access by SearchForm
  if (IS_BROWSER && results && results.length > 0) {
    props.formIds.value.push("show", "from", "filter");
  }

  if (IS_BROWSER && (new URL(window.location.href)).searchParams.has("prefix") && !results) {
    // GET request with POST data in URL, so submit form to redirect to POST
    setTimeout(() => {
      const form = document.getElementById("pageForm") as HTMLFormElement;
      form.submit();
    }, 0);
  }


  function submitForm() {
    // const form = document.getElementById("hiddenPageFormSubmit") as HTMLButtonElement;
    // form.click();
    const form = document.getElementById("pageForm") as HTMLFormElement;
    form.dispatchEvent(new Event("submit"));
    form.submit();
  }

  function onShowChange() {
    const from = document.getElementById("from") as HTMLInputElement;
    from.value = "1";
    submitForm();
  }

  function clearFilter() {
    const filter = document.getElementById("filter") as HTMLInputElement;
    filter.value = "";
  }

  function page(forward: boolean) {
    const newFrom = forward ? props.from + props.show : props.from - props.show;
    if (newFrom > displayResults!.length) {
      return;
    } 
    
    const from = document.getElementById("from") as HTMLInputElement;
    from.value = newFrom < 1 ? "1" : newFrom.toString();
    submitForm();
  }

  return (
    <div>
      {displayResults && displayResults!.length > 0 &&
        (
          <>
            <div class="flex items-center justify-start mt-3">
              <label for="filter">Filter</label>
              <input type="text" id="filter" name="filter" form="pageForm" class="rounded bg-blue-100 ml-2 p-2 my-2" value={filter}/>
              <Help dialogId="filterHelp" dialogTitle="Filter">
                <p>Free text search of key and values.  Only entries which contain the exact filter substring in 
                either the key or value are included.  Both keys are values are converted to strings using JSON.toString()
                prior to searching. NOTE: Filtering only applies to the result set, not the search.</p>
              </Help>
              <button type="button" onClick={clearFilter} class={BUTTON}>Clear</button>
              <button type="submit" class={BUTTON}>Apply</button>
            </div>
            <div class={TW_TABLE_WRAPPER}>
              <table class={TW_TABLE}>
                <thead class={TW_THEAD}>
                  <tr>
                    <th class={TW_TH + " w-12"}>
                      <input
                        id="selectAll"
                        type="checkbox"
                        name="selectAll"
                        class="w-4 h-4"
                      />
                    </th>
                    <th class={TW_TH}>Key</th>
                    <th class={TW_TH}>Value</th>
                  </tr>
                </thead>
                <tbody class={TW_TBODY}>
                  {resultsToShow!.map((kvResult) => {
                    const result = createKvUIEntry(kvResult);
                    return (
                      <tr class={TW_TR}>
                        <td class={TW_TD + " w-12 text-center"}>
                          <input
                            id={"select_" + result.key}
                            type="checkbox"
                            name={"select_" + result.key}
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
                  Showing {props.from} to {to} of {props.searchComplete ? displayResults.length + entries : " many"}
                  <input id="from" name="from" type="hidden" form="pageForm" value={props.from}/>
                  <button class={BUTTON} onClick={() => page(false)} disabled={props.from===1}>&lt;</button>
                  <button class={BUTTON} onClick={() => page(true)} disabled={props.from + props.show > displayResults.length}>&gt;</button>
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
}
