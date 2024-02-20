import { effect, useSignal } from "@preact/signals";
import { JSX } from "preact";
import { Toast } from "../../islands/Toast.tsx";
import { DeleteKeyData } from "../../routes/api/deleteKey.tsx";
import { CopyDeleteSingleProps, ToastType } from "../../types.ts";
import { Caution } from "../Caution.tsx";

export function DeleteKeyDialog(props: CopyDeleteSingleProps) {
  const {
    kvKey,
    connections,
    connectionLocation,
    connectionId,
  } = props;
  const isDeleting = useSignal(false);
  const showToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("info");

  effect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDeleting.value && event.key === "Escape") {
        event.preventDefault();
      }
    };

    self.addEventListener("keydown", handleKeyDown);

    return () => {
      self.removeEventListener("keydown", handleKeyDown);
    };
  });

  function cancelDialog(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    const dialog = document.getElementById("deleteDialog")! as HTMLDialogElement;
    dialog.close();
    dialog.classList.remove("modal");
  }

  function deleteConfirmed(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    isDeleting.value = true;
    document.body.style.cursor = "progress";

    fetch("/api/deleteKey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          connectionId,
          keyToDelete: kvKey,
        } satisfies DeleteKeyData,
      ),
    }).then((response) => {
      response.text().then((text) => {
        if (response.status === 200) {
          showToast(text, "info");
          console.log("Deletion successful");
        } else {
          // unexpected error
          showToast(text, "error");
          console.error(text);
        }
      }).catch((e) => {
        console.error("Error while parsing response text", e);
        showToast("An unexpected error occurred: Unable to read response", "error");
      });
    }).catch((e) => {
      console.error("Failure with delete request", e);
      showToast("An unexpected error occurred: Unable to send request", "error");
    }).finally(() => {
      const dialog = document.getElementById("deleteDialog")! as HTMLDialogElement;
      dialog.close();
      dialog.classList.remove("modal");

      isDeleting.value = false;
      document.body.style.cursor = "default";
      (document.getElementById("getResults")! as HTMLDivElement).style.display = "none";
      (document.getElementById("pageForm")! as HTMLFormElement).reset();
    });
  }

  function showToast(msg: string, type: ToastType) {
    toastMsg.value = msg;
    toastType.value = type;
    showToastSignal.value = true;
  }

  function connNameAndEnv() {
    const conn = connections?.filter((c) => c.id === connectionId)[0];
    return conn ? conn.name + " (" + conn.env + ")" : "";
  }

  function isProd() {
    const env = connections?.filter((c) => c.id === connectionId)[0]?.env;
    return env === "Deploy prod";
  }

  return (
    <>
      <dialog
        id="deleteDialog"
        class=""
      >
        <div class="modal-box mb-3">
          <p class="font-bold text-xl">
            Confirm delete
          </p>
          <div class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3">
            <table class="table">
              <tr>
                <td class="w-40 text-right pr-6 font-bold">Connection</td>
                <td>
                  <input
                    type="text"
                    disabled={true}
                    value={connNameAndEnv()}
                    class="input input-bordered w-full"
                  />
                </td>
              </tr>
              <tr>
                <td class="text-right pr-6 font-bold">Location</td>
                <td class="break-all">
                  <textarea
                    id="locationTextArea"
                    type="text"
                    disabled={true}
                    value={connectionLocation}
                    class="textarea textarea-bordered text-area-sm w-full h-48"
                  />
                </td>
              </tr>
              <tr>
                <td class="text-right pr-6 font-bold">Entries to delete</td>
                <td>
                  <input
                    type="text"
                    disabled={true}
                    value={1}
                    class="input input-bordered w-full"
                  />
                </td>
              </tr>
            </table>
          </div>
          <Caution>
            <p class="text-yellow-500 ml-2">
              Check details carefully. This action cannot be undone.
            </p>
          </Caution>
          {isProd() && (
            <Caution>
              <p class="text-yellow-500 ml-2">Caution: This is a production environment</p>
            </Caution>
          )}
          <div class="flex gap-x-3 mt-5 justify-center">
            <button class="btn btn-secondary" disabled={isDeleting} onClick={cancelDialog}>
              Cancel
            </button>
            <button class="btn btn-primary" disabled={isDeleting} onClick={deleteConfirmed}>
              Delete
            </button>
          </div>
        </div>
      </dialog>
      <Toast
        id="deleteCompletedToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </>
  );
}
