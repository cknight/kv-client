import { JSX } from "preact/jsx-runtime";
import { BUTTON } from "../consts.ts";
import { ComponentChildren } from "preact";

interface HelpProps {
  children: ComponentChildren;
  dialogId: string;
  dialogTitle: string;
}

export function Help(props: HelpProps) {
  function showHelp() {
    console.log("showHelp");
    const dialog = document.getElementById(props.dialogId) as HTMLDialogElement;
    dialog.showModal();
    const okButton = dialog.querySelector("button");
    okButton?.focus();
  }

  function cancelDialog(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    (document.getElementById(props.dialogId)! as HTMLDialogElement).close();
  }

  return (
    <div>
      <svg
        class="ml-3 h-6 w-6 text-[#8E939F] cursor-pointer"
        onClick={showHelp}
        tabindex={0}
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" /> <circle cx="12" cy="12" r="9" />{" "}
        <line x1="12" y1="17" x2="12" y2="17.01" />{" "}
        <path d="M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4" />
      </svg>
      <dialog id={props.dialogId} class="relative p-0 border-2 border-gray-700 rounded max-w-xl">
        <div class="p-4">
          <div class="mb-3">
            <p class="font-bold text-xl">{props.dialogTitle}</p>
          </div>
          <div class="mt-3">
            {props.children}
          </div>
          <div class="sticky bg-white bottom-0 flex py-3 justify-center">
            <button class={BUTTON} onClick={cancelDialog}>OK</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
