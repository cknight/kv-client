import { effect, Signal, useSignal } from "@preact/signals";
import { BUTTON } from "../../consts.ts";
import { JSX } from "preact/jsx-runtime";
import { readableSize } from "../../utils/utils.ts";
import { useEffect, useRef } from "preact/hooks";
import { UpdateKeyData } from "../../routes/api/updateKey.tsx";
import { Toast } from "../../islands/Toast.tsx";
import { ToastType } from "../../types.ts";

interface KvDialogProps {
  kvKey: Signal<string>;
  kvValue: Signal<string>;
  connectionId: string;
  prefix: string;
  start: string;
  end: string;
  from: number;
  show: number;
  reverse: boolean;
  kvKeyHash: Signal<string>;
  showToastSignal: Signal<boolean>;
  toastMsg: Signal<string>;
  toastType: Signal<ToastType>;
}

export function KvDialog(props: KvDialogProps) {
  const { connectionId, prefix, start, end, from, show, reverse, kvKeyHash } = props;
  const inEditMode = useSignal(false);
  const keySize = readableSize(JSON.stringify(props.kvKey.value).length);
  const valueSize = readableSize(JSON.stringify(props.kvValue.value).length);
  const okButtonRef = useRef<HTMLButtonElement>(null);

  effect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        inEditMode.value = false;
      }
    };

    self.addEventListener("keydown", handleKeyDown);

    return () => {
      self.removeEventListener("keydown", handleKeyDown);
    };
  });

  useEffect(() => {
    const textArea = document.getElementById("valueTextArea") as HTMLTextAreaElement;
    textArea.style.height = "0px";
    const scrollHeight = textArea.scrollHeight + 5;
    textArea.style.height = scrollHeight + "px";
  }, [props.kvValue.value]);

  useEffect(() => {
    const valueTextArea = document.getElementById("valueTextArea") as HTMLTextAreaElement;
    if (valueTextArea) {
      valueTextArea.selectionStart = 0;
      valueTextArea.selectionEnd = 0;
      valueTextArea.focus();
    }
  }, [inEditMode.value]);

  function closeDialog(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    inEditMode.value = false;
    (document.getElementById("kvDialog")! as HTMLDialogElement).close();
  }

  function editValue(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    inEditMode.value = true;
    const textArea = document.getElementById("valueTextArea") as HTMLTextAreaElement;
    setTimeout(() => {
      textArea.focus();
    }, 0);
  }

  function submitEdit(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    props.kvValue.value = (document.getElementById("valueTextArea") as HTMLTextAreaElement).value;

    fetch("/api/updateKey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          connectionId,
          keyHash: kvKeyHash.value,
          value: props.kvValue.value,
          prefix,
          start,
          end,
          from,
          show,
          reverse,
        } satisfies UpdateKeyData,
      ),
    }).then((response) => {
      if (response.ok) {
        (document.getElementById("kvDialog")! as HTMLDialogElement).close();
        console.log("Entry successfully updated");
        showToast("Entry successfully updated", "info");
        inEditMode.value = false;
      } else {
        response.text().then((data) => {
          console.error("Failed to update key", data);
          showToast(data, "error");
        });
      }
    }).catch((e) => {
      console.error("Failed to update key", e.message);
      showToast(e.message, "error");
    }).finally(() => {
    });
  }

  function cancelEdit(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    inEditMode.value = false;
    (document.getElementById("kvDialog")! as HTMLDialogElement).close();
  }

  function showToast(msg: string, type: ToastType) {
    props.toastMsg.value = msg;
    props.toastType.value = type;
    props.showToastSignal.value = true;
  }

  return (
    <>
      <dialog
        id="kvDialog"
        class="p-4 border-2 border-gray-700 rounded w-[80%]"
      >
        <div class="mb-3">
          <div class="font-bold text-xl">
            Key <span class="font-light text-base">(~ {keySize})</span>
          </div>
          <div class="mt-3">
            <pre class="border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10">{props.kvKey.value}</pre>
          </div>
          <div class="mt-3 font-bold text-xl">
            Value <span class="font-light text-base">(~ {valueSize})</span>
          </div>
          <div class="mt-3">
            <textarea
              id="valueTextArea"
              disabled={!inEditMode.value}
              class="border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
              value={props.kvValue.value}
            />
          </div>
          <div class="flex mt-3 justify-center">
            {inEditMode.value
              ? <button id="cancelButton" class={BUTTON} onClick={cancelEdit}>Cancel</button>
              : <button class={BUTTON} onClick={editValue}>Edit value</button>}
            {inEditMode.value
              ? <button class={BUTTON} onClick={submitEdit}>Submit</button>
              : (
                <button id="okButton" ref={okButtonRef} class={BUTTON} onClick={closeDialog}>
                  OK
                </button>
              )}
          </div>
        </div>
      </dialog>
    </>
  );
}
