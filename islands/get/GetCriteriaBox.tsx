import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { ToastType } from "../../types.ts";
import { clearGetForm, submitGetForm } from "../../utils/ui/form.ts";
import { Toast } from "../Toast.tsx";
import { KvKeyEditor } from "../keyValue/KvKeyEditor.tsx";

interface GetDataProps {
  kvKey: string;
  error?: string;
}

export function GetCriteriaBox(data: GetDataProps) {
  const kvKeySignal = useSignal(data.kvKey);
  const showToastSignal = useSignal(data.error ? true : false);
  const toastMsg = useSignal(data.error || "");
  const toastType = useSignal<ToastType>("error");

  useEffect(() => {
    if (data.error) {
      document.getElementById("getResults")!.style.display = "none";
    }
  });

  function resetForm(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    clearGetForm();
    document.getElementById("getResults")!.style.display = "none";
  }

  function submitForm(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    document.body.style.cursor = "wait";

    submitGetForm();
  }

  return (
    <div class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3">
      <KvKeyEditor showDoNotOverwrite={false} kvKeyValue={kvKeySignal} typesId="getTypes" />
      <div class="flex w-full justify-center gap-x-4 mt-4">
        <button
          type="button"
          onClick={resetForm}
          form="pageForm"
          class="btn btn-secondary w-[72px]"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={submitForm}
          form="pageForm"
          class="btn btn-primary w-[72px]"
        >
          Get
        </button>
      </div>
      <Toast
        id="getCriteriaToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </div>
  );
}
