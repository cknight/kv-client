import { JSX } from "preact";
import { effect, useSignal } from "@preact/signals";
import { CopyDeleteProps, ToastType } from "../../types.ts";
import { CopyKeysData } from "../../routes/api/copyKeys.tsx";
import { Toast } from "../../islands/Toast.tsx";
import { WarningTriangleIcon } from "../svg/WarningTriangle.tsx";

export function CopyDataDialog(props: CopyDeleteProps) {
  const {
    keysSelected,
    connections,
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
  const isCopying = useSignal(false);
  const abortId = useSignal(crypto.randomUUID());
  const showToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("info");
  const isProd = useSignal(false);

  effect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isCopying.value && event.key === "Escape") {
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
    const dialog = document.getElementById("copyDialog")! as HTMLDialogElement;
    dialog.close();
    dialog.classList.remove("modal");
  }

  function copyConfirmed(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    isCopying.value = true;
    abortId.value = crypto.randomUUID();
    const dest = document.getElementById("dest")! as HTMLSelectElement;
    document.body.style.cursor = "progress";

    fetch("/api/copyKeys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          sourceConnectionId: connectionId,
          destConnectionId: dest.value,
          keysToCopy: keysSelected,
          filter,
          prefix,
          start,
          end,
          from,
          show,
          reverse,
          abortId: abortId.value,
        } satisfies CopyKeysData,
      ),
    }).then((response) => {
      response.text().then((text) => {
        if (response.status === 200) {
          showToast(text, "info");
          console.log("Copy successful:", results(), "key(s) copied");
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
      console.error("Failure with copy request", e);
      showToast("An unexpected error occurred: Unable to send request", "error");
    }).finally(() => {
      const dialog = document.getElementById("copyDialog")! as HTMLDialogElement;
      dialog.close();
      dialog.classList.remove("modal");
      isCopying.value = false;
      document.body.style.cursor = "default";
    });
  }

  function showToast(msg: string, type: ToastType) {
    toastMsg.value = msg;
    toastType.value = type;
    showToastSignal.value = true;
  }

  function abortCopy(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form

    fetch("/api/abortCopy", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: abortId.value,
    }).then((_resp) => {
      console.log("Aborting copy");
    }).catch((e) => {
      console.error("Failure with abort request", e);
      showToast("An unexpected error occurred: Unable to abort request", "error");
    });
  }

  function results(): number {
    return keysSelected.length === 0 ? resultsCount : keysSelected.length;
  }

  function connectionList(): Map<string, { name: string; id: string }[]> {
    const envMap = new Map<string, { name: string; id: string }[]>();
    connections?.filter((c) => c.id !== connectionId).forEach((connection) => {
      if (!envMap.has(connection.env)) {
        envMap.set(connection.env, []);
      }
      envMap.get(connection.env)!.push(connection);
    });
    envMap.forEach((connections, env) => {
      envMap.set(env, connections.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return envMap;
  }

  function connNameAndEnv() {
    const conn = connections?.filter((c) => c.id === connectionId)[0];
    return conn ? conn.name + " (" + conn.env + ")" : "";
  }

  function checkIfProd() {
    const dest = document.getElementById("dest")! as HTMLSelectElement;
    const conn = connections?.filter((c) => c.id === dest.value)[0];
    isProd.value = conn?.env === "prod";
  }

  return (
    <>
      <dialog
        id="copyDialog"
        class=""
      >
        <div class="modal-box mb-3">
          <h2 class="font-bold text-xl">
            Copy results
          </h2>
          <p class="mt-3">Copy {results()} result{results() > 0 ? "s" : ""}</p>
          <div class="my-3">
            <table class="table">
              <tr>
                <td class="w-[60px]">From</td>
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
                <td class="pt-3 w-[60px]">To</td>
                <td class="pt-3">
                  <select
                    id="dest"
                    onChange={checkIfProd}
                    class="select select-bordered w-full"
                  >
                    <option value="" disabled selected>Please select</option>
                    {[...connectionList().keys()].sort().map((environment) => (
                      <optgroup label={environment}>
                        {connectionList().get(environment)!.map((conn) => (
                          <option value={conn.id}>{conn.name + " (" + environment + ")"}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </td>
              </tr>
            </table>
          </div>
          <p>Warning: Any existing keys will be overwritten</p>
          {isProd.value && (
            <div class="my-4 flex flex-row">
              <WarningTriangleIcon />
              <span class="text-red-500 font-semibold pl-1 pr-2 underline decoration-red-500">
                Caution:
              </span>
              <p class="text-red-500 break-all">Copy destination is a production environment</p>
            </div>
          )}
          <div class="flex gap-x-3 mt-5 justify-center">
            {isCopying.value
              ? <button class="btn btn-secondary" onClick={abortCopy}>Abort</button>
              : (
                <>
                  <button class="btn btn-secondary" onClick={cancelDialog}>Cancel</button>
                  <button class="btn btn-primary" onClick={copyConfirmed}>Copy</button>
                </>
              )}
          </div>
        </div>
      </dialog>
      <Toast
        id="copyCompletedToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </>
  );
}
