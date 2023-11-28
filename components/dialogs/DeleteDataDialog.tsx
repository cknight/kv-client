import { JSX } from "preact";
import { BUTTON } from "../../consts.ts";
import { effect, useSignal } from "@preact/signals";
import { DeleteKeysData } from "../../routes/api/deleteKeys.tsx";
import { CopyDeleteProps, ToastType } from "../../types.ts";
import { Toast } from "../../islands/Toast.tsx";
import { WarningTriangleIcon } from "../svg/WarningTriangle.tsx";

export function DeleteDataDialog(props: CopyDeleteProps) {
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
    (document.getElementById("deleteDialog")! as HTMLDialogElement).close();
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
      (document.getElementById("deleteDialog")! as HTMLDialogElement).close();
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

    fetch("/api/abortDelete", {
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
    return env === "prod";
  }

  return (
    <>
      <dialog
        id="deleteDialog"
        class="p-4 border-2 border-gray-700 rounded shadow max-w-[800px]"
      >
        <div class="mb-3">
          <p class="font-bold text-xl">
            Confirm delete
          </p>
          <div class="mt-3">
            <table class="w-full">
              <tr>
                <td class="w-40 text-right pr-6 font-bold">Connection</td>
                <td>
                  <input
                    type="text"
                    disabled={true}
                    value={connNameAndEnv()}
                    class="border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
                  />
                </td>
              </tr>
              <tr>
                <td class="text-right pr-6 font-bold">Location</td>
                <td class="break-all">
                  <textarea
                    type="text"
                    disabled={true}
                    value={connectionLocation}
                    class="border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
                  />
                </td>
              </tr>
              <tr>
                <td class="text-right pr-6 font-bold">Entries to delete</td>
                <td>
                  <input
                    type="text"
                    disabled={true}
                    value={keysSelected.length === 0 ? resultsCount : keysSelected.length}
                    class="border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
                  />
                </td>
              </tr>
            </table>
          </div>
          <p class="my-4">Check the above details carefully. This action cannot be undone.</p>
          { isProd() && (
            <div class="my-4 flex flex-row">
              <WarningTriangleIcon />
              <span class="text-red-500 font-semibold pl-1 pr-2 underline decoration-red-500">
                Caution:
              </span>
              <p class="text-red-500">This is a production environment</p>
            </div>
          )}
          <div class="flex mt-3 justify-center">
            {isDeleting.value ? <button class={BUTTON} onClick={abortDelete}>Abort</button> : (
              <>
                <button class={BUTTON} onClick={cancelDialog}>Cancel</button>
                <button class={BUTTON} onClick={deleteConfirmed}>Delete</button>
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
