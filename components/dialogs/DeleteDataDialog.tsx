import { JSX } from "preact";
import { BUTTON } from "../../consts.ts";
import { effect, useSignal } from "@preact/signals";
import { DeleteKeysData } from "../../routes/api/deleteKeys.tsx";
import { CopyDeleteProps } from "../../types.ts";

export function DeleteDataDialog(props: CopyDeleteProps) {
  const {
    keysSelected,
    connectionName,
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

    fetch("/api/deleteKeys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      } satisfies DeleteKeysData),
    }).then((response) => {
      if (response.status === 200) {
        console.log("Deletion successful:", keysSelected.length, "key(s) deleted");
        (document.getElementById("deleteDialog")! as HTMLDialogElement).close();
      } else {
        response.text().then((text) => {
          console.error(text);
        });
      }
    }).catch((e) => {
      console.error("Failure with delete request", e);
    }).finally(() => {
      window.location.reload();
    });
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
    });
  }

  return (
    <dialog
      id="deleteDialog"
      class="p-4 border-2 border-gray-700 rounded shadow"
    >
      <div class="mb-3">
        <p class="font-bold text-xl">
          Confirm delete
        </p>
        <div class="mt-3">
          <table>
            <tr>
              <td>Connection name</td>
              <td>{connectionName}</td>
            </tr>
            <tr>
              <td>Connection location</td>
              <td>{connectionLocation}</td>
            </tr>
            <tr>
              <td>Key/Value pairs to delete</td>
              <td>{keysSelected.length === 0 ? resultsCount : keysSelected.length}</td>
            </tr>
          </table>
        </div>
        <p>Check the above details carefully. This action cannot be undone.</p>
        <div class="flex mt-3 justify-center">
          {isDeleting.value ? (
              <button class={BUTTON} onClick={abortDelete}>Abort</button>
          ) : (
            <>
              <button class={BUTTON} onClick={cancelDialog}>Cancel</button>
              <button class={BUTTON} onClick={deleteConfirmed}>OK</button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
