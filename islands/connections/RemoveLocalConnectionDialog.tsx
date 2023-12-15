import { JSX } from "preact";

export function RemoveLocalConnectionDialog() {
  function closeDialog(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    //event.preventDefault(); //e.g. don't submit the form
    (document.getElementById("removeLocalConnectionDialog")! as HTMLDialogElement).close();
  }

  return (
    <dialog
      id="removeLocalConnectionDialog"
      class="modal"
    >
      <div class="modal-box">
        <h1 class="text-xl font-bold leading-tight tracking-tight md:text-2xl">
          Remove "<span id="removeLocalConnectionName"></span>"?
        </h1>
        <div class="flex flex-col mt-3 justify-center">
          <p>
            This will remove the connection from the connections list. It will not affect any data.
          </p>
          <form method="post" class="mt-3 flex justify-center">
            <input type="hidden" id="removeLocalConnectionId" name="removeLocalConnectionId" />
            <button
              class="btn btn-primary mr-2"
              type="submit"
              name="formAction"
              value="removeLocalConnection"
            >
              OK
            </button>
            <button class="btn btn-primary ml-2" type="button" onClick={closeDialog}>Cancel</button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
