import { Signal, useSignal, useSignalEffect } from "@preact/signals";
import { ToastType } from "../types.ts";
import { XIcon } from "../components/svg/XIcon.tsx";

interface ToastProperties {
  show: Signal<boolean>;
  id: string;
  message: string;
  type: ToastType;
}

const infoStyle = `text-white bg-blue-600 hover:bg-blue-700`;
const warnStyle = `text-black bg-[#F59E0B] hover:bg-[#D97706]`;
const errorStyle = `text-white bg-red-600 hover:bg-red-700`;

const infoErrorCloseColor = "text-white";
const warnCloseColor = "text-black";

export function Toast(props: ToastProperties) {
  useSignalEffect(() => {
    if (props.show.value) {
      setTimeout(() => {
        props.show.value = false;
      }, 15000);
    }
  });

  const styleType = props.type == "info"
    ? infoStyle
    : (props.type == "warn" ? warnStyle : errorStyle);
  const closeColor = props.type === "warn" 
    ? warnCloseColor
    : infoErrorCloseColor;
  return (
    <div
      id={props.id}
      onClick={() => props.show.value = false}
      class={`fixed top-5 right-5 transition-all duration-500 cursor-pointer ${
        props.show.value ? "opacity-100" : "opacity-0"
      } ${props.show.value ? "translate-x-0 " : "translate-x-full"}`}
    >
      <div
        id="toast-simple"
        class={`${styleType} max-w-[400px] p-4 inline-flex rounded-lg items-center shadow`}
        role="alert"
      >
        <div><XIcon title="close" textColor={closeColor}/></div>
        <div class="text-base font-bold ml-3">{props.message}</div>
      </div>
    </div>
  );
}
