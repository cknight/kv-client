import { BUTTON } from "../consts.ts";
import { Fragment, JSX } from "preact";
import { KvKeyEditor } from "./KvKeyEditor.tsx";
import { KvValueEditor } from "./KvValueEditor.tsx";
import { KvAddEntry } from "../routes/api/addEntry.tsx";
import { SupportedValueTypes, ToastType } from "../types.ts";
import { useSignal } from "@preact/signals";
import { Toast } from "./Toast.tsx";

export function AddEntryEditor() {
  const showToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("info");

  function clearForm() {
    const form = document.getElementById("pageForm") as HTMLFormElement;
    form.reset();
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
    const value = document.getElementById("kvValue")! as HTMLInputElement;
    const valueType = document.getElementById("valueType")! as HTMLSelectElement;
    const doNotOverwrite = document.getElementById("doNotOverwrite")! as HTMLInputElement;

    fetch("/api/addEntry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          key: key.value,
          value: value.value,
          valueType: valueType.value as SupportedValueTypes,
          doNotOverwrite: doNotOverwrite.checked,
          connectionId: new URLSearchParams(window.location.search).get("connectionId")!,
        } satisfies KvAddEntry,
      ),
    }).then((response) => {
      response.text().then((text) => {
        if (response.status === 200) {
          showToast(text, "info");
          console.log("Entry successfully added");
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
      console.error("Failure with add entry request", e);
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
      <KvValueEditor />
      <div class="flex w-full justify-center mt-8">
        <button type="button" onClick={clearForm} class={BUTTON + " w-20 ml-0 justify-center"}>
          Clear
        </button>
        <button type="button" onClick={submitEntry} class={BUTTON + " w-20 ml-0 justify-center"}>
          Submit
        </button>
      </div>
      <Toast
        id="addEntryToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </Fragment>
  );
}
