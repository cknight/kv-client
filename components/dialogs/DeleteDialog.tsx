import { getUserState } from "../../utils/state.ts";
import { keyToBase64 } from "../../utils/encodeKvKey.ts";
import { JSX } from "preact";
import { BUTTON } from "../../consts.ts";
import { createKvUIEntry } from "../../utils/utils.ts";
import { Signal, useSignal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { connections } from "../../routes/_layout.tsx";

interface DeleteDialogProps {
  keysToDelete: string[];
  session: string;
  prefix: string;
  start: string;
  end: string;
  reverse: boolean;
}
export function DeleteDialog(props: DeleteDialogProps) {
  console.log("delete dialog", props);
  const { keysToDelete, session, prefix, start, end, reverse } = props;

  // FIXME - entire connection handling needs rethought
  const connectionId = localStorage.getItem("KV_explorer_connection");

  const connName = connections.value.find((c) => c.id === connectionId)?.name ||
    "No connection established";
  const connLocation = connections.value.find((c) => c.id === connectionId)?.kvLocation ||
    "No connection established";
  //Need to move a lot of logic to a REST endpoint

  let kvKeysToDelete: Deno.KvEntry<unknown>[] = [];

  if (props.keysToDelete.length > 0) {
    // const cachedSearch = state.cache.get({ connection, prefix, start, end, reverse });
    // kvKeysToDelete = cachedSearch!.dataRetrieved.filter((e) => keysToDelete.includes(keyToBase64(createKvUIEntry(e))));

    // if (kvKeysToDelete.length !== keysToDelete.length) {
    //   console.log(kvKeysToDelete);
    //   throw new Error("Internal error.  Mismatch between keys to delete and keys retrieved from cache.  Aborting.");
    // }
  }

  function cancelDialog(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    (document.getElementById("deleteDialog")! as HTMLDialogElement).close();
  }

  function deleteConfirmed() {
    console.log("Deleting " + kvKeysToDelete.length + " keys");
  }

  return (
    <dialog
      id="deleteDialog"
      class="p-4 border-2 border-gray-700 rounded shadow"
    >
      <div class="mb-3">
        <p class="font-bold text-xl">
          Confirm delete
        </p>
        <div class="mt-3">
          <table>
            <tr>
              <td>Connection name</td>
              <td>{connName}</td>
            </tr>
            <tr>
              <td>Connection location</td>
              <td>{connLocation}</td>
            </tr>
            <tr>
              <td>Key/Value pairs to delete</td>
              <td>{kvKeysToDelete.length}</td>
            </tr>
          </table>
        </div>
        <p>Check the above details carefully. This action cannot be undone.</p>
        <div class="flex mt-3 justify-center">
          <button class={BUTTON} onClick={deleteConfirmed}>OK</button>
        </div>
      </div>
    </dialog>
  );
}
