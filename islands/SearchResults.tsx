import {
  KvUIEntry,
  TW_TABLE,
  TW_TABLE_WRAPPER,
  TW_TBODY,
  TW_TD,
  TW_TH,
  TW_THEAD,
  TW_TR,
} from "../types.ts";

interface SearchResultsProps {
  results: KvUIEntry[] | undefined;
  validationError?: string;
}
export function SearchResults(props: SearchResultsProps) {
  const { results, validationError } = props;

  if (validationError) {
    return <p class="text-2xl text-red-500">{validationError}</p>;
  } else if (results === undefined) {
    return <></>;
  } else if (results.length === 0) {
    return <div>No results found.</div>;
  }

  return (
    <div>
      {props.results!.length > 0 &&
        (
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
                {props.results!.map((result) => {
                  return (
                    <tr class={TW_TR}>
                      <td class={TW_TD + " w-12 text-center"}>
                        <input
                          id="selectAll"
                          type="checkbox"
                          name="selectAll"
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
          </div>
        )}
    </div>
  );
}
