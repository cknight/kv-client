import { KvInstance } from "../../types.ts";
import { signal } from "@preact/signals";

export interface DiscoverConnectionsDialogProps {
  kvInstances: KvInstance[];
}

//FIXME: This doesn't belong here.  Move it to a more appropriate place.
const radioSelected = signal(false);

export function DiscoverConnectionsDialog(props: DiscoverConnectionsDialogProps) {
  function cancelDialog() {
    (document.getElementById("discoverConnectionsDialog")! as HTMLDialogElement).close();
  }
  function addConnection() {
    const selectedLocation = document.querySelector('input[name="localLocation"]:checked');
    if (selectedLocation) {
      (document.getElementById("discoverConnectionsDialog")! as HTMLDialogElement).close();
      (document.getElementById("connectionLocation")! as HTMLInputElement).value =
        (selectedLocation as HTMLInputElement).id;
      (document.getElementById("addEditConnectionDialog")! as HTMLDialogElement).showModal();
    }
  }
  function kvInstanceChosen() {
    radioSelected.value = true;
  }

  return (
    <dialog id="discoverConnectionsDialog" class="relative p-0 border-2 border-gray-700 rounded">
      <div class="p-4">
        <div class="mb-3">
          <p class="font-bold text-xl">Local KV connections</p>
        </div>
        <div class="mt-3">
          <p class="my-2">
            Below are auto-discovered KV stores with a selection of sample data to help identify the
            KV store. Choose one or manually enter a location.
          </p>
          <table>
            <tbody>
              {props.kvInstances.map((kv) => (
                <tr class="border-b-1 border-red-500 p-2">
                  <td class="text-center w-20">
                    <input
                      type="radio"
                      name="localLocation"
                      id={kv.kvLocation}
                      onClick={kvInstanceChosen}
                    />
                  </td>
                  <td class="break-words py-4" id={kv.kvLocation + "_information"}>
                    <p class="font-bold">{kv.kvLocation}</p>
                    <table class="w-full border-1 mt-2">
                      <thead>
                        <tr class="border-b-1">
                          <th>Key</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kv.dataSelection.map((data) => (
                          <tr class="border-b-1">
                            <td class="w-96">{data.key}</td>
                            <td title={data.fullValue}>{data.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div class="sticky bg-white border-1 bottom-0 flex py-3 justify-center pt-5">
        <form method="post">
          <input type="hidden" id="connectionId" name="connectionId" />
          <div class="mt-3">
            <label for="connectionName" class="inline-block w-[70px]">
              Name:
            </label>
            <input
              id="connectionName"
              name="connectionName"
              class="rounded bg-blue-100 w-96 mx-2 p-2"
            />
          </div>
          <div class="mt-3">
            <label for="connectionLocation" class="inline-block w-[70px]">
              Location:
            </label>
            <input
              id="connectionLocation"
              name="connectionLocation"
              class="rounded bg-blue-100 w-96 mx-2 p-2"
            />
          </div>
          <div class="flex mt-3 justify-center">
            <button
              class="btn btn-primary"
              type="submit"
              name="connectionAction"
              value="addEdit"
            >
              <span data-type="addEdit">Add</span>
            </button>
            <button class="btn btn-secondary" onClick={cancelDialog}>Cancel</button>
          </div>
        </form>
        {
          /* <button class="btn btn-primary" onClick={addConnection} disabled={!radioSelected.value}>Add</button>
        <button class="btn btn-primary" onClick={cancelDialog}>Cancel</button> */
        }
      </div>
    </dialog>
  );
}
