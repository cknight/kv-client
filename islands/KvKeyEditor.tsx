import { Signal, useSignal } from "@preact/signals";
import { JSX } from "preact/jsx-runtime";
import { KvKeyInput } from "../components/KvKeyInput.tsx";
import { Help } from "./Help.tsx";
import { KeyHelp } from "../components/KeyHelp.tsx";

export function KvKeyEditor() {
  const keyParts: Signal<{ key: string; type: string }[]> = useSignal([]);

  function buildParts(): { key: string; type: string }[] {
    let i = 0;
    const newParts = [];
    while (true) {
      const keyPart = document.getElementById(`kvKeyIndex` + i) as HTMLInputElement;
      const typeHelper = document.getElementById(`typeHelper` + i) as HTMLSelectElement;
      i++;
      if (keyPart === null) break;
      if (keyPart.value === "") continue;
      newParts.push({ key: keyPart.value, type: typeHelper.value });
    }
    return newParts;
  }

  return (
    <div>
      <h1 class="text-2xl font-bold">Key</h1>
      <div class="w-full flex items-center mt-1">
        <div class="w-full">
          <KvKeyInput
            id="kvKey"
            form="pageForm"
            type="text"
            name="kvKey"
            class="rounded bg-blue-100 w-full p-2"
          />
        </div>
        <Help dialogId="kvKeyHelp" dialogTitle="KV key">
          <KeyHelp keyPart="key" />
        </Help>
      </div>
      <div class="w-full flex items-center ml-2 mt-5">
        <label for="doNotOverwrite" class="mr-4">Do not overwrite</label>
        <input
          id="doNotOverwrite"
          form="pageForm"
          type="checkbox"
          name="reverse"
          class="mr-4 w-4 h-4"
          checked={true}
        />
        <Help dialogId="doNotOverwriteHelp" dialogTitle="Do not overwrite">
          <p>If selected, the add operation will fail if the key already exists in KV</p>
        </Help>
      </div>
    </div>
  );
}
