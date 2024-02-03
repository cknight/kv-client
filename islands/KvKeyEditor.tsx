import { effect, Signal, useSignal, useSignalEffect } from "@preact/signals";
import { KvKeyInput } from "./KvKeyInput.tsx";
import { Help } from "./Help.tsx";
import { KeyHelp } from "../components/ListKeyHelp.tsx";
import { readableSize } from "../utils/utils.ts";
import { debounce } from "../utils/ui/debounce.ts";
import { BasicKeyHelp } from "../components/BasicKeyHelp.tsx";

interface KvKeyEditorProps {
  kvKeyValue: Signal<string>;
  typesId?: string;
  showDoNotOverwrite: boolean;
}

export function KvKeyEditor(props: KvKeyEditorProps) {
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

  function onKeyInput(event: Event) {
    debouncedUpdateKeyLength(event);
    props.kvKeyValue.value = (event.target as HTMLInputElement).value;
  }

  return (
    <div>
      <h1 class="text-2xl font-bold">
        Key <span id="keySizeSpan" class="hidden font-light text-base">(~ {keySize.value})</span>
      </h1>
      <div class="w-full flex items-center mt-1">
        <div class="w-full">
          <KvKeyInput
            id="kvKey"
            form="pageForm"
            type="text"
            value={props.kvKeyValue.value}
            typesId={props.typesId}
            onInput={onKeyInput}
            name="kvKey"
            class="input input-bordered input-primary w-full p-2"
          />
        </div>
        <div class="pb-3">
          <Help dialogId="kvKeyHelp" dialogTitle="KV key">
            <BasicKeyHelp />
          </Help>
        </div>
      </div>
      {props.showDoNotOverwrite && (
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
              If selected, the <code>set</code> operation will fail if the key already exists in KV.
            </p>
          </Help>
        </div>
      )}
    </div>
  );
}
