import { useSignal } from "@preact/signals";
import { JSX } from "preact";
import { ToastType } from "../../types.ts";
import { Toast } from "../Toast.tsx";

export function RemoveLocalConnectionDialog() {
  const showToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("info");

  function closeDialog(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    //event.preventDefault(); //e.g. don't submit the form
    (document.getElementById("removeLocalConnectionDialog")! as HTMLDialogElement).close();
  }

  function removeConnection(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    const connectionId =
      (document.getElementById("removeLocalConnectionId")! as HTMLInputElement).value;
    fetch("/api/removeConnection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          connectionId,
        },
      ),
    }).then((res) => {
      if (res.status === 200) {
        window.location.reload();
      } else {
        toastMsg.value = "Error removing connection";
        toastType.value = "error";
        showToastSignal.value = true;
        console.error(res);
      }
    });
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
          <div class="mt-3 flex justify-center">
            <input type="hidden" id="removeLocalConnectionId" name="removeLocalConnectionId" />
            <button class="btn btn-secondary mr-2" type="button" onClick={closeDialog}>
              Cancel
            </button>
            <button
              class="btn btn-primary ml-2"
              type="submit"
              name="formAction"
              onClick={removeConnection}
              value="removeLocalConnection"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
      <Toast
        id="copyCompletedToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </dialog>
  );
}
