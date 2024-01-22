import { JSX } from "preact/jsx-runtime";
import { KeyHelp } from "../components/ListKeyHelp.tsx";
import { clearGetForm, submitGetForm } from "../utils/ui/form.ts";
import { Help } from "./Help.tsx";
import { KvKeyInput } from "./KvKeyInput.tsx";
import { KvKeyEditor } from "./KvKeyEditor.tsx";
import { useSignal } from "@preact/signals";

interface GetDataProps {
  kvKey: string;
}

export function GetCriteriaBox(data: GetDataProps) {
  const kvKeySignal = useSignal(data.kvKey);

  function resetForm(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    clearGetForm();
    document.getElementById('getResults')!.style.display='none';
  }

  function submitForm(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    document.body.style.cursor = "wait"; // Set the cursor to 'wait'

    submitGetForm();
  }

  return (
    <div class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3">
      <KvKeyEditor showDoNotOverwrite={false} kvKeyValue={kvKeySignal} />
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
    </div>
  );
}
