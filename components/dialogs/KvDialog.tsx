import { Signal } from "@preact/signals";
import { BUTTON } from "../../consts.ts";
import { JSX } from "preact/jsx-runtime";

export function KvDialog(props: { kvKey: Signal<string>; kvValue: Signal<string> }) {
  function closeDialog(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    (document.getElementById("kvDialog")! as HTMLDialogElement).close();
  }

  return (
    <dialog
      id="kvDialog"
      class="p-4 border-2 border-gray-700 rounded"
    >
      <div class="mb-3">
        <p class="font-bold text-xl">
          Key
        </p>
        <div class="mt-3">
          <pre>{props.kvKey.value}</pre>
        </div>
        <p class="mt-3 font-bold text-xl">
          Value
        </p>
        <div class="mt-3">
          <pre>{props.kvValue.value}</pre>
        </div>
        <div class="flex mt-3 justify-center">
          <button class={BUTTON} onClick={closeDialog}>OK</button>
        </div>
      </div>
    </dialog>
  );
}
