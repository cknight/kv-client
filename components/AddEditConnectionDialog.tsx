import { Signal } from "@preact/signals";
import { BUTTON, KvConnection } from "../types.ts";
import { ulid } from "$std/ulid/mod.ts";
import { JSX } from "preact/jsx-runtime";

export function AddEditConnectionDialog() {
  function cancelDialog(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    (document.getElementById("connectionId")! as HTMLInputElement).value = "";
    (document.getElementById("connectionName")! as HTMLInputElement).value = "";
    (document.getElementById("connectionLocation")! as HTMLInputElement).value =
      "";
    (document.getElementById("addEditConnectionDialog")! as HTMLDialogElement)
      .close();
  }

  return (
    <dialog
      id="addEditConnectionDialog"
      class="p-4 border-2 border-gray-700 rounded"
    >
      <div class="mb-3">
        <p class="font-bold text-xl">
          <span data-type="addEdit">Add</span> new connection
        </p>
      </div>
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
            class={BUTTON}
            type="submit"
            name="connectionAction"
            value="addEdit"
          >
            <span data-type="addEdit">Add</span>
          </button>
          <button class={BUTTON} onClick={cancelDialog}>Cancel</button>
        </div>
      </form>
    </dialog>
  );
}
