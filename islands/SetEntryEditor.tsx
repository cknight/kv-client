import { Fragment, JSX } from "preact";
import { KvKeyEditor } from "./KvKeyEditor.tsx";
import { KvValueEditor } from "./KvValueEditor.tsx";
import { KvSetEntry } from "../routes/api/setEntry.tsx";
import { SupportedValueTypes, ToastType } from "../types.ts";
import { useSignal } from "@preact/signals";
import { Toast } from "./Toast.tsx";

export function SetEntryEditor() {
  const showToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("info");

  function clearForm() {
    const key = document.getElementById("kvKey")! as HTMLInputElement;
    const simpleValue = document.getElementById("textarea")! as HTMLTextAreaElement;
    const complexValue = document.getElementById("kvValue")! as HTMLTextAreaElement;
    const valueType = document.getElementById("valueType")! as HTMLSelectElement;
    const typeHelper = document.getElementById("typeHelper")! as HTMLSelectElement;
    const doNotOverwrite = document.getElementById("doNotOverwrite")! as HTMLInputElement;

    key.value = "";
    simpleValue.value = "";
    complexValue.value = "";
    //@ts-ignore - ace editor is globaldavid
    globalThis.editor.setValue("");
    valueType.value = "";
    typeHelper.value = "";
    doNotOverwrite.checked = true;

    (document.getElementById("textarea") as HTMLTextAreaElement).classList.add("hidden");
    (document.getElementById("editor") as HTMLDivElement).classList.add("hidden");
    (document.getElementById("typeHelperSection") as HTMLDivElement).classList.add("hidden");
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
    const simpleValue = document.getElementById("textarea")! as HTMLTextAreaElement;
    const complexValue = document.getElementById("kvValue")! as HTMLTextAreaElement;
    const valueType = document.getElementById("valueType")! as HTMLSelectElement;
    const doNotOverwrite = document.getElementById("doNotOverwrite")! as HTMLInputElement;

    const simpleTypes = [
      "bigint",
      "boolean",
      "null",
      "number",
      "string",
      "Date",
      "KvU64",
      "RegExp",
      "Uint8Array",
    ];
    let kvValue = "";
    if (simpleTypes.includes(valueType.value)) {
      kvValue = simpleValue.value;
    } else {
      kvValue = complexValue.value;
    }


    fetch("/api/setEntry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          key: key.value,
          value: kvValue,
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
      <KvKeyEditor />
      <div class="divider"></div>
      <KvValueEditor />
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
