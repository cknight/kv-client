import { useSignal } from "@preact/signals";
import { Fragment, JSX } from "preact";
import { KvSetEntry } from "../routes/api/setEntry.tsx";
import { SupportedValueTypes, ToastType } from "../types.ts";
import { Toast } from "./Toast.tsx";
import { KvKeyEditor } from "./keyValue/KvKeyEditor.tsx";
import { KvValueEditor } from "./keyValue/KvValueEditor.tsx";

export function SetEntryEditor() {
  const showToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("info");
  const valueType = useSignal("");
  const kvValue = useSignal("");
  const readOnly = useSignal(false);
  const kvKey = useSignal("");

  function clearForm() {
    const key = document.getElementById("kvKey")! as HTMLInputElement;
    const typeHelper = document.getElementById("typeHelper")! as HTMLSelectElement;
    const doNotOverwrite = document.getElementById("doNotOverwrite")! as HTMLInputElement;

    //@ts-ignore - ace editor is global
    globalThis.editor.setValue("");
    key.value = "";
    typeHelper.value = "";
    valueType.value = "";
    doNotOverwrite.checked = true;
  }

  function validate(): boolean {
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

  function submitEntry(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();

    if (!validate()) return;

    const key = document.getElementById("kvKey")! as HTMLInputElement;
    const valueType = document.getElementById("valueType")! as HTMLSelectElement;
    const doNotOverwrite = document.getElementById("doNotOverwrite")! as HTMLInputElement;
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

  function showToast(msg: string, type: ToastType) {
    toastMsg.value = msg;
    toastType.value = type;
    showToastSignal.value = true;
  }

  return (
    <Fragment>
      <KvKeyEditor showDoNotOverwrite={true} kvKeyValue={kvKey} />
      <div class="divider"></div>
      <KvValueEditor kvValueType={valueType} kvValue={kvValue} readOnly={readOnly} />
      <div class="flex w-full justify-center mt-8 gap-x-3">
        <button type="button" onClick={clearForm} class="btn btn-secondary">
          Clear
        </button>
        <button type="button" onClick={submitEntry} class="btn btn-primary">
          Submit
        </button>
      </div>
      <Toast
        id="setEntryToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </Fragment>
  );
}
