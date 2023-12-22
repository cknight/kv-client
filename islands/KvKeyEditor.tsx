import { Signal, useSignal } from "@preact/signals";
import { KvKeyInput } from "./KvKeyInput.tsx";
import { Help } from "./Help.tsx";
import { KeyHelp } from "../components/KeyHelp.tsx";
import { readableSize } from "../utils/utils.ts";
import { debounce } from "../utils/ui/debounce.ts";

export function KvKeyEditor() {
  const keyParts: Signal<{ key: string; type: string }[]> = useSignal([]);
  const keySize = useSignal("0");

  const debouncedUpdateKeyLength = debounce(updateKeyLength, 300);

  function updateKeyLength(event: Event) {
    const key = (event.target as HTMLInputElement).value;
    keySize.value = readableSize(JSON.stringify(key).length);
    const keySizeSpan = document.getElementById("keySizeSpan")!;
    if (key === "") {
      keySizeSpan.classList.add("hidden");
    } else {
      keySizeSpan.classList.remove("hidden");
    }
  }

  return (
    <div>
      <h1 class="text-2xl font-bold">Key <span id="keySizeSpan" class="hidden font-light text-base">(~ {keySize.value})</span></h1>
      <div class="w-full flex items-center mt-1">
        <div class="w-full">
          <KvKeyInput
            id="kvKey"
            form="pageForm"
            type="text"
            onInput={debouncedUpdateKeyLength}
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
