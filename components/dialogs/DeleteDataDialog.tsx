import { effect, useSignal } from "@preact/signals";
import { JSX } from "preact";
import { Toast } from "../../islands/Toast.tsx";
import { DeleteKeysData } from "../../routes/api/deleteKeys.tsx";
import { CopyDeleteMultiProps, ToastType } from "../../types.ts";
import { Caution } from "../Caution.tsx";

export function DeleteDataDialog(props: CopyDeleteMultiProps) {
  const {
    keysSelected,
    connections,
    connectionLocation,
    connectionId,
    prefix,
    start,
    end,
    from,
    show,
    resultsCount,
    reverse,
    filter,
  } = props;
  const isDeleting = useSignal(false);
  const abortId = useSignal(crypto.randomUUID());
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
    abortId.value = crypto.randomUUID();
    document.body.style.cursor = "progress";

    fetch("/api/deleteKeys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          connectionId,
          keysToDelete: keysSelected,
          filter,
          prefix,
          start,
          end,
          from,
          show,
          reverse,
          abortId: abortId.value,
        } satisfies DeleteKeysData,
      ),
    }).then((response) => {
      response.text().then((text) => {
        if (response.status === 200) {
          showToast(text, "info");
          console.log("Deletion successful:", keysSelected.length, "key(s) deleted");
        } else if (response.status < 500) {
          // e.g. aborted copy
          showToast(text, "warn");
          console.warn(text);
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
      (document.getElementById("resultsPanel")! as HTMLDivElement).style.display = "none";
      //window.location.reload();
    });
  }

  function showToast(msg: string, type: ToastType) {
    toastMsg.value = msg;
    toastType.value = type;
    showToastSignal.value = true;
  }

  function abortDelete(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form

    fetch("/api/abort", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: abortId.value,
    }).then((_resp) => {
      console.log("Aborting delete");
    }).catch((e) => {
      console.error("Failure with abort request", e);
      showToast("An unexpected error occurred: Unable to abort request", "error");
    });
  }

  function connNameAndEnv() {
    const conn = connections?.filter((c) => c.id === connectionId)[0];
    return conn ? conn.name + " (" + conn.env + ")" : "";
  }

  function isProd() {
    const env = connections?.filter((c) => c.id === connectionId)[0]?.env;
    return env === "Deploy prod";
  }

  function keyCountToDelete(): number {
    return keysSelected.length === 0 ? resultsCount : keysSelected.length;
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
                    class="textarea textarea-bordered text-area-sm w-full h-32"
                  />
                </td>
              </tr>
              <tr>
                <td class="text-right pr-6 font-bold">Entries to delete</td>
                <td>
                  <input
                    type="text"
                    disabled={true}
                    value={keyCountToDelete()}
                    class="input input-bordered w-full"
                  />
                </td>
              </tr>
            </table>
          </div>
          <Caution>
            <div class="flex flex-col">
              <p class="text-yellow-500 ml-2">Caution:</p>
              <ul class="text-yellow-500 list-disc">
                <li>Check details carefully. This action cannot be undone.</li>
                {keyCountToDelete() > 40 && (
                  // 40 keys is the theoretical maximum to guarantee consistency
                  // 40 keys at 2kb/key = 80kb, which is the maximum allowed in a single transaction
                  <li>
                    Consistency may not be guaranteed (<a
                      href="https://kv-client.dev/docs/consistency-and-caching"
                      target="_blank"
                      class="link text-blue-400"
                    >
                      more info
                    </a>)
                  </li>
                )}
              </ul>
            </div>
          </Caution>
          {isProd() && (
            <Caution>
              <p class="text-yellow-500 ml-2">Caution: This is a production environment</p>
            </Caution>
          )}
          <div class="flex gap-x-3 mt-5 justify-center">
            {isDeleting.value
              ? <button class="btn btn-secondary" onClick={abortDelete}>Abort</button>
              : (
                <>
                  <button class="btn btn-secondary" onClick={cancelDialog}>Cancel</button>
                  <button class="btn btn-primary" onClick={deleteConfirmed}>Delete</button>
                </>
              )}
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
