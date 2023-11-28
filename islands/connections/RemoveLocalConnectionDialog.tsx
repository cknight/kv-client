import { JSX } from "preact";
import { BUTTON } from "../../consts.ts";

export function RemoveLocalConnectionDialog() {
  function closeDialog(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    //event.preventDefault(); //e.g. don't submit the form
    (document.getElementById("removeLocalConnectionDialog")! as HTMLDialogElement).close();
  }

  return (
    <dialog
      id="removeLocalConnectionDialog"
      class="p-4 border-2 border-gray-700 rounded"
    >
      <div class="mb-3">
        <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
          Remove <span id="removeLocalConnectionName"></span>?
        </h1>
        <div class="flex mt-3 justify-center">
          <form method="post">
            <input type="hidden" id="removeLocalConnectionId" name="removeLocalConnectionId"/>
            <button class={BUTTON} type="submit" name="formAction" value="removeLocalConnection">OK</button>
            <button class={BUTTON} type="button" onClick={closeDialog}>Cancel</button>
          </form>
        </div>
      </div>
    </dialog>
  );
}