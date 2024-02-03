import { useSignal } from "@preact/signals";
import { KvUIEntry, SupportedValueTypes, ToastType } from "../../types.ts";
import { KvValueEditor } from "../keyValue/KvValueEditor.tsx";
import { JSX } from "preact/jsx-runtime";
import { Toast } from "../Toast.tsx";
import { KvSetEntry } from "../../routes/api/setEntry.tsx";
import { DeleteKeyDialog } from "../../components/dialogs/DeleteKeyDialog.tsx";
import { CopyKeyDialog } from "../../components/dialogs/CopyKeyDialog.tsx";

interface GetResultProps {
  connectionId: string;
  connections: { name: string; id: string; env: string }[];
  connectionLocation: string;
  kvKey: string;
  result?: KvUIEntry;
}

export function GetResult(props: GetResultProps) {
  const fullViewValue = useSignal(props.result ? props.result.value : "");
  const fullViewValueType = useSignal(props.result ? props.result.valueType : "");
  const readOnly = useSignal(true);
  const inEditMode = useSignal(false);
  const showToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("info");

  function enableEditMode() {
    inEditMode.value = true;
    readOnly.value = false;
  }

  function cancelEdit() {
    inEditMode.value = false;
    readOnly.value = true;
    fullViewValue.value = props.result ? props.result.value : "";
    fullViewValueType.value = props.result ? props.result.valueType : "";
  }

  function showToast(msg: string, type: ToastType) {
    toastMsg.value = msg;
    toastType.value = type;
    showToastSignal.value = true;
  }

  function submitEntry(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();

    const key = document.getElementById("kvKey")! as HTMLInputElement;
    const valueType = document.getElementById("valueType")! as HTMLSelectElement;
    //@ts-ignore - ace editor is global
    const kvValue = globalThis.editor.getValue();

    fetch("/api/setEntry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          key: key.value,
          kvValue,
          valueType: valueType.value as SupportedValueTypes,
          doNotOverwrite: false,
          connectionId: new URLSearchParams(window.location.search).get("connectionId")!,
        } satisfies KvSetEntry,
      ),
    }).then((response) => {
      response.text().then((text) => {
        if (response.status === 200) {
          showToast(text, "info");
          console.log("Entry successfully set");
          inEditMode.value = false;
          readOnly.value = true;
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
      console.error("Failure with set entry request", e);
      showToast("An unexpected error occurred: Unable to send request", "error");
    });
  }

  function deleteEntry(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const dialog = document.getElementById("deleteDialog") as HTMLDialogElement;
    dialog.showModal();
    dialog.classList.add("modal");
  }

  function copyEntry(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const dialog = document.getElementById("copyDialog") as HTMLDialogElement;
    dialog.showModal();
    dialog.classList.add("modal");
  }

  return (
    <>
      {props.result && (
        <div id="getResults" class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3">
          <KvValueEditor
            kvValueType={fullViewValueType}
            kvValue={fullViewValue}
            readOnly={readOnly}
          />
          {inEditMode.value && (
            <div class="flex w-full justify-center gap-x-4 mt-4">
              <button
                type="button"
                form="pageForm"
                onClick={cancelEdit}
                class="btn btn-secondary w-[72px]"
              >
                Cancel
              </button>
              <button
                type="button"
                form="pageForm"
                onClick={submitEntry}
                class="btn btn-primary w-[72px]"
              >
                Submit
              </button>
            </div>
          )}
          {!inEditMode.value && (
            <div class="flex w-full justify-center gap-x-4 mt-4">
              <button
                type="button"
                form="pageForm"
                onClick={deleteEntry}
                class="btn btn-primary w-[72px]"
              >
                Delete
              </button>
              <button
                type="button"
                form="pageForm"
                onClick={copyEntry}
                class="btn btn-primary w-[72px]"
              >
                Copy
              </button>
              <button
                type="button"
                form="pageForm"
                onClick={enableEditMode}
                class="btn btn-primary w-[72px]"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )}
      {!props.result && props.kvKey !== "" && (
        <div id="getResults" class="flex mt-5 ml-2 text-2xl text-red-400">
          No results found
        </div>
      )}
      <DeleteKeyDialog
        connectionId={props.connectionId}
        connectionLocation={props.connectionLocation}
        connections={props.connections}
        kvKey={props.kvKey}
      />
      <CopyKeyDialog
        connectionId={props.connectionId}
        connectionLocation={props.connectionLocation}
        connections={props.connections}
        kvKey={props.kvKey}
      />
      <Toast
        id="getEntryToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </>
  );
}
