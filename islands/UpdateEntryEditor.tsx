import { Fragment, JSX } from "preact";
import { KvValueEditor } from "./KvValueEditor.tsx";
import { KvSetEntry } from "../routes/api/setEntry.tsx";
import { SupportedValueTypes, ToastType } from "../types.ts";
import { Signal, useSignal } from "@preact/signals";
import { Toast } from "./Toast.tsx";
import { simpleTypes } from "../consts.ts";
import { readableSize } from "../utils/utils.ts";

interface KvDialogProps {
  kvKey: Signal<string>;
  kvValue: Signal<string>;
  kvValueType: Signal<string>
  connectionId: string;
  kvKeyHash: Signal<string>;
  showToastSignal: Signal<boolean>;
  toastMsg: Signal<string>;
  toastType: Signal<ToastType>;
}

export function UpdateEntryEditor(props: KvDialogProps) {
  const showToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("info");
  const keySize = readableSize(JSON.stringify(props.kvKey.value).length);
  const inEditMode = useSignal(false);
  const readOnly = useSignal(true);

  function clearForm() {
    // TODO clean up

    const key = document.getElementById("kvKey")! as HTMLInputElement;
    const valueType = document.getElementById("valueType")! as HTMLSelectElement;
    const typeHelper = document.getElementById("typeHelper")! as HTMLSelectElement;
    const doNotOverwrite = document.getElementById("doNotOverwrite")! as HTMLInputElement;

    key.value = "";
    //@ts-ignore - ace editor is global
    globalThis.editor.setValue("");
    valueType.value = "";
    typeHelper.value = "";
    doNotOverwrite.checked = true;
  }

  function validate(): boolean {
    //TODO clean up (no key validation)

    const key = document.getElementById("kvKey")! as HTMLInputElement;
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

    if (!validate()) return;

    //@ts-ignore - ace editor is global
    const kvValue = globalThis.editor.getValue();
    const key = document.getElementById("kvKey")! as HTMLInputElement;
    const valueType = document.getElementById("valueType")! as HTMLSelectElement;
    const doNotOverwrite = document.getElementById("doNotOverwrite")! as HTMLInputElement;

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
          doNotOverwrite: doNotOverwrite.checked,
          connectionId: new URLSearchParams(window.location.search).get("connectionId")!,
        } satisfies KvSetEntry,
      ),
    }).then((response) => {
      response.text().then((text) => {
        if (response.status === 200) {
          showToast(text, "info");
          console.log("Entry successfully set");
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
    const textArea = document.getElementById("valueTextArea") as HTMLTextAreaElement;
    setTimeout(() => {
      textArea.focus();
    }, 0);
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
    showToastSignal.value = true;
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
              type="text"
              disabled={true}
              value={props.kvKey.value}
              class="textarea text-area-sm w-full"
            />
          </div>
          <div class="divider"></div>
          <KvValueEditor kvValueType={props.kvValueType} kvValue={props.kvValue} readOnly={readOnly}/>
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

          {
            /* <div class="flex w-full justify-center mt-8 gap-x-3">
        <button type="button" onClick={clearForm} class="btn btn-secondary">
          Clear
        </button>
        <button type="button" onClick={submitEntry} class="btn btn-primary">
          Submit
        </button>
        </div> */
          }
        </div>
      </dialog>
      <Toast
        id="setEntryToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </Fragment>
  );
}
