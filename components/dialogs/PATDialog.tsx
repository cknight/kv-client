import { BUTTON, LINK } from "../../consts.ts";
import { JSX } from "preact/jsx-runtime";

export function PATDialog(props: { validationError?: string }) {
  function cancelDialog(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    (document.getElementById("accessTokenDialog")! as HTMLDialogElement)
      .close();
  }

  return (
    <dialog
      id="accessTokenDialog"
      class="p-4 border-2 border-gray-700 rounded"
    >
      <div class="mb-3">
        <p class="font-bold text-xl">
          Remote Access Token
        </p>
        {props.validationError && (
          <div class="mt-3 text-red-500 w-full">{props.validationError}</div>
        )}
        <p class="mt-3">
          If necessary, visit{" "}
          <a class={LINK} target="_blank" href="https://dash.deno.com/account#access-tokens">
            https://dash.deno.com/account#access-tokens
          </a>{" "}
          to create a new remote access token.
        </p>
        <div class="w-full flex items-center my-4">
          <label for="pat" class="w-24">Token</label>
          <input
            id="pat"
            form="pageForm"
            type="text"
            name="pat"
            class="rounded bg-blue-100 w-full p-2 ml-6 mr-3"
          />
        </div>
        <div class="flex mt-3 justify-center">
          <button class={BUTTON} onClick={cancelDialog}>Cancel</button>
          <button type="submit" form="pageForm" class="px-2 py-1 rounded mx-4 bg-[#6b6bff]">
            Submit
          </button>
        </div>
      </div>
    </dialog>
  );
}
