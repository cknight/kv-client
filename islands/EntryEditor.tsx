import { Fragment, JSX } from "preact";
import { KvValueEditor } from "./KvValueEditor.tsx";
import { KvSetEntry } from "../routes/api/setEntry.tsx";
import { SupportedValueTypes, ToastType } from "../types.ts";
import { Signal, useSignal } from "@preact/signals";
import { Toast } from "./Toast.tsx";
import { simpleTypes } from "../consts.ts";
import { readableSize } from "../utils/utils.ts";

interface EntryEditorProps {
  kvKey: Signal<string>;
  kvValue: Signal<string>;
  kvValueType: Signal<string>;
  connectionId: string;
  kvKeyHash: Signal<string>;
  showToastSignal: Signal<boolean>;
  toastMsg: Signal<string>;
  toastType: Signal<ToastType>;
  shouldShowResults: Signal<boolean>;
}

export function EntryEditor(props: EntryEditorProps) {
  const showErrorToastSignal = useSignal(false);
  const showSuccessToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("info");
  const keySize = readableSize(JSON.stringify(props.kvKey.value).length);
  const inEditMode = useSignal(false);
  const readOnly = useSignal(true);

  function validate(): boolean {
    const key = document.getElementById("kvKey")! as HTMLTextAreaElement;
    const valueType = document.getElementById("valueType")! as HTMLSelectElement;

    if (key.value.trim() === "") {
      showToast("Key cannot be empty", "error");
      return false;
    }

    if (valueType.value === "") {
      showToast("Please choose a value type", "error");
      return false;
    }

    return true;
  }

  function submitValueUpdate(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    showErrorToastSignal.value = false;
    if (!validate()) return;

    //@ts-ignore - ace editor is global
    const kvValue = globalThis.editor.getValue();
    const key = document.getElementById("kvKey")! as HTMLTextAreaElement;
    const valueType = document.getElementById("valueType")! as HTMLSelectElement;
    const keyValues = key.value.slice(1, -1);

    fetch("/api/setEntry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          key: keyValues,
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
          closeDialog(event);
          props.shouldShowResults.value = false;
          console.log("Entry successfully updated");
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

  function editValue(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    inEditMode.value = true;
    readOnly.value = false;
  }

  function cancelEdit(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    inEditMode.value = false;
    readOnly.value = true;
    const dialog = document.getElementById("kvDialog")! as HTMLDialogElement;
    dialog.close();
    dialog.classList.remove("modal");
    //Reset the editor content as the component can't bind to the signal directly
    //@ts-ignore - ace editor is global
    globalThis.editor.setValue(props.kvValue.value);
  }

  function closeDialog(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    inEditMode.value = false;
    const dialog = document.getElementById("kvDialog")! as HTMLDialogElement;
    dialog.close();
    dialog.classList.remove("modal");
  }

  function showToast(msg: string, type: ToastType) {
    toastMsg.value = msg;
    toastType.value = type;
    if (type === "error") showErrorToastSignal.value = true;
    else showSuccessToastSignal.value = true;
  }

  return (
    <Fragment>
      <dialog
        id="kvDialog"
        class=""
      >
        <div class="modal-box mb-3 max-w-[800px]">
          <div class="font-bold text-xl">
            Key <span class="font-light text-base">(~ {keySize})</span>
          </div>
          <div class="mt-3">
            <textarea
              id="kvKey"
              type="text"
              disabled={true}
              value={props.kvKey.value}
              class="textarea text-area-sm w-full h-8"
            />
          </div>
          <div class="divider"></div>
          <KvValueEditor
            kvValueType={props.kvValueType}
            kvValue={props.kvValue}
            readOnly={readOnly}
          />
          <div class="flex gap-x-3 mt-5 justify-center">
            {inEditMode.value
              ? (
                <button id="cancelButton" class="btn btn-secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              )
              : <button class="btn btn-primary" onClick={editValue}>Edit value</button>}
            {inEditMode.value
              ? <button class="btn btn-primary" onClick={submitValueUpdate}>Submit</button>
              : (
                <button
                  id="okButton"
                  class="btn btn-primary"
                  onClick={closeDialog}
                >
                  OK
                </button>
              )}
          </div>
        </div>
        <Toast
          id="setEntryErrorToast"
          message={toastMsg.value}
          show={showErrorToastSignal}
          type={toastType.value}
        />
      </dialog>
      <Toast
        id="setEntrySuccessToast"
        message={toastMsg.value}
        show={showSuccessToastSignal}
        type={toastType.value}
      />
    </Fragment>
  );
}
