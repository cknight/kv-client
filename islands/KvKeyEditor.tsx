import { Signal, useSignal } from "@preact/signals";
import { KvKeyInput } from "../components/KvKeyInput.tsx";
import { Help } from "./Help.tsx";
import { KeyHelp } from "../components/KeyHelp.tsx";

export function KvKeyEditor() {
  const keyParts: Signal<{ key: string; type: string }[]> = useSignal([]);

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
            class="input input-bordered input-primary w-full p-2"
          />
        </div>
        <div class="pb-3">
          <Help dialogId="kvKeyHelp" dialogTitle="KV key">
            <KeyHelp keyPart="key" />
          </Help>
        </div>
      </div>
      <div class="w-full flex items-center ml-2 mt-5">
        <label for="doNotOverwrite" class="mr-4">Do not overwrite</label>
        <input
          id="doNotOverwrite"
          form="pageForm"
          type="checkbox"
          name="reverse"
          class="checkbox checkbox-sm checkbox-primary w-4 h-4"
          checked={true}
        />
        <Help dialogId="doNotOverwriteHelp" dialogTitle="Do not overwrite">
          <p>
            If selected, the <code>set</code> operation will fail if the key already exists in KV
          </p>
        </Help>
      </div>
    </div>
  );
}
