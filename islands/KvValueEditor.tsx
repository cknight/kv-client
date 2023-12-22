import { Signal, useSignal, useSignalEffect } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { Help } from "./Help.tsx";
import { SupportedValueTypes } from "../types.ts";
import { KvValueJson } from "../routes/api/valueSize.tsx";
import { debounce } from "../utils/ui/debounce.ts";

interface KvValueEditorProps {
  kvValue: Signal<string>;
  kvValueType: Signal<string>;
  readOnly: Signal<boolean>;
}

export function KvValueEditor(props: KvValueEditorProps) {
  // deno-lint-ignore no-explicit-any
  const editor = useSignal<any>(null);
  const disabledTypeTemplates = useSignal<string[]>([]);
  const isSimpleType = useSignal(false);
  const valueSize = useSignal("0");

  function initAce() {
    //@ts-ignore - ace is a global export from ace.js
    editor.value = ace.edit("editor");
    editor.value.setOptions({
      printMargin: false,
      readOnly: false,
    });
    editor.value.setTheme("ace/theme/merbivore");
    editor.value.setOption("placeholder", "Placeholder text")
    editor.value.getSession().setUseWrapMode(true);
    editor.value.session.on('change', debouncedUpdateValueSize);
    editor.value.setReadOnly(props.readOnly.value);
    
    //@ts-ignore - For browser console testing
    globalThis.editor = editor.value;
  }

  function insertTypeTemplate(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const typeHelper = (document.getElementById("typeHelper") as HTMLSelectElement).value;
    if (typeHelper === "") return;

    const cursor = editor.value.getCursorPosition();
    const session = editor.value.session;
    if (typeHelper === "Uint8Array") {
      session.insert(cursor, `{ type: "Uint8Array", value: [255, 1, 2, 163] }`);
    } else if (typeHelper === "KvU64") {
      session.insert(cursor, `{ type: "KvU64", value: "12345678901234567890" }`);
    } else if (typeHelper === "JSON") {
      session.insert(cursor, `'{ "foo": "bar", "hello": true }'`);
    } else if (typeHelper === "Date") {
      session.insert(cursor, `{ type: "Date", value: "${new Date().toISOString()}" }`);
    } else if (typeHelper === "RegExp") {
      session.insert(cursor, `{ type: "RegExp", value: "/^foo/" }`);
    } else if (typeHelper === "Map") {
      session.insert(cursor, `{ type: "Map", value: [["foo","bar"],["hello", "world"]] }`);
    } else if (typeHelper === "Set") {
      session.insert(cursor, `{ type: "Set", value: ["foo", "hello"] }`);
    } else if (typeHelper === "Array") {
      session.insert(cursor, `["foo", "hello"]`);
    } else if (typeHelper === "Object") {
      session.insert(cursor, `{ foo: "bar", c: 1234 }`);
    } else if (typeHelper === "true" || typeHelper === "false" || typeHelper === "null") {
      session.insert(cursor, typeHelper);
    } else if (typeHelper === "string") {
      session.insert(cursor, `"foo"`);
    } else if (typeHelper === "number") {
      session.insert(cursor, `123`);
    } else if (typeHelper === "bigint") {
      session.insert(cursor, `{ type: "bigint", value: "1234213421352" }`);
    }
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/ace.min.js";
    script.defer = true;
    script.onload = () => initAce();

    // const beautifyScript = document.createElement("script");
    // script.src = "/ext-beautify.min.js";
    // script.defer = true;

    document.body.appendChild(script);
    // document.body.appendChild(beautifyScript);

    return () => {
      document.body.removeChild(script);
      // document.body.removeChild(beautifyScript);
    };
  }, []);
  
  useSignalEffect(() => {
    if (editor.value === null) return;

    editor.value.setValue(props.kvValue.value);
    updateEditorMode(props.kvValueType.value);
    editor.value.selection.moveCursorTo(0, 0);
  });

  useSignalEffect(() => {
    if (editor.value === null) return;

    editor.value.setReadOnly(props.readOnly.value);
  });

  const shorthandAvailableTypes = new Map([
    ["bigint", "example: 123456789"],
    ["boolean", "example: true"],
    ["null", "example: null"],
    ["number", "example: 132"],
    ["string", "example: This is a string"],
    ["Date", "example: 2023-11-21T22:02:07.710Z"],
    ["KvU64", "example: 12343234236132"],
    ["RegExp", "example: /^[0-9]\d*$/"],
    ["Uint8Array", "example: [231,6,123]"],
  ]);

  function updateTypeChosen() {
    const value = (document.getElementById("valueType") as HTMLSelectElement).value;
    props.kvValueType.value = value;
    updateEditorMode(value);
  }

  function updateEditorMode(value: string) {
    isSimpleType.value = shorthandAvailableTypes.get(value) !== undefined;

    if (value === "JSON") {
      editor.value.session.setMode("ace/mode/json");
    } else if (isSimpleType.value) {
      editor.value.session.setMode("ace/mode/text");
    } else {
      editor.value.session.setMode("ace/mode/json5");
    }
  }

  function updateValueSize() {
    const valueType = document.getElementById("valueType")! as HTMLSelectElement;
    const kvValue = editor.value.getValue();

    const valueSizeSpan = document.getElementById("valueSizeSpan")! as HTMLSpanElement;
    fetch("/api/valueSize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          valueString: kvValue,
          valueType: valueType.value as SupportedValueTypes,
        } satisfies KvValueJson,
      ),
    }).then((response) => {
      response.text().then((text) => {
        if (response.status === 200) {
          valueSizeSpan.classList.remove("hidden");
          valueSize.value = text;
        } else {
          valueSizeSpan.classList.add("hidden");
        }
      }).catch((e) => {
        valueSizeSpan.classList.add("hidden");
      });
    }).catch((e) => {
      valueSizeSpan.classList.add("hidden");
    });
  }
  const debouncedUpdateValueSize = debounce(updateValueSize, 300);

  return (
    <div class="flex flex-col w-full mt-4">
      <h1 class="text-2xl font-bold">Value <span id="valueSizeSpan" class="hidden font-light text-base">(~ {valueSize.value})</span></h1>
      <div class="flex flex-col w-full">
        <div class="mt-4 mr-4 w-[200px] flex flex-row justify-between">
          <div class="flex flex-col ">
            <label for="valueType" class="font-semibold whitespace-nowrap">Value Type</label>
            <select
              id="valueType"
              class="select select-bordered select-sm select-primary mt-1"
              value={props.kvValueType.value}
              disabled={props.readOnly.value}
              onChange={updateTypeChosen}
            >
              <option value="" disabled={true} selected={true}>Please select</option>
              <option value="Array">Array</option>
              <option value="bigint">bigint</option>
              <option value="boolean">boolean</option>
              <option value="Date">Date</option>
              <option value="JSON">JSON</option>
              <option value="KvU64">KvU64</option>
              <option value="Map">Map</option>
              <option value="null">null</option>
              <option value="number">number</option>
              <option value="Object">Object</option>
              <option value="RegExp">RegExp</option>
              <option value="Set">Set</option>
              <option value="string">string</option>
              <option value="Uint8Array">Uint8Array</option>
            </select>
          </div>
          {props.kvValueType.value !== ""
            && props.kvValueType.value !== "JSON"
            && !isSimpleType.value
            && !props.readOnly.value
            && (
            <div id="typeHelperSection" class="flex flex-row items-end ml-6">
              <div class="flex flex-col">
              <label for="typeHelper" class="font-semibold whitespace-nowrap">
                Type templates
              </label>
              <div class="flex items-center">
                <select
                  id="typeHelper"
                  class="select select-bordered select-sm select-primary mt-1"
                >
                  <option value="" disabled={true} selected={true}>Please select</option>
                  <optgroup label="Primitive types">
                    <option
                      value="bigint"
                      disabled={disabledTypeTemplates.value.includes("bigint")}
                    >
                      bigint
                    </option>
                    <option
                      value="true"
                      disabled={disabledTypeTemplates.value.includes("boolean")}
                    >
                      true
                    </option>
                    <option
                      value="false"
                      disabled={disabledTypeTemplates.value.includes("boolean")}
                    >
                      false
                    </option>
                    <option
                      value="null"
                      disabled={disabledTypeTemplates.value.includes("null")}
                    >
                      null
                    </option>
                    <option
                      value="number"
                      disabled={disabledTypeTemplates.value.includes("number")}
                    >
                      number
                    </option>
                    <option
                      value="string"
                      disabled={disabledTypeTemplates.value.includes("string")}
                    >
                      string
                    </option>
                  </optgroup>
                  <optgroup label="Complex types">
                    <option
                      value="Array"
                      disabled={disabledTypeTemplates.value.includes("Array")}
                    >
                      Array
                    </option>
                    <option
                      value="Date"
                      disabled={disabledTypeTemplates.value.includes("Date")}
                    >
                      Date
                    </option>
                    <option
                      value="JSON"
                      disabled={disabledTypeTemplates.value.includes("JSON")}
                    >
                      JSON
                    </option>
                    <option
                      value="KvU64"
                      disabled={disabledTypeTemplates.value.includes("KvU64")}
                    >
                      KvU64
                    </option>
                    <option
                      value="Map"
                      disabled={disabledTypeTemplates.value.includes("Map")}
                    >
                      Map
                    </option>
                    <option
                      value="Object"
                      disabled={disabledTypeTemplates.value.includes("Object")}
                    >
                      Object
                    </option>
                    <option
                      value="RegExp"
                      disabled={disabledTypeTemplates.value.includes("RegExp")}
                    >
                      RegExp
                    </option>
                    <option
                      value="Set"
                      disabled={disabledTypeTemplates.value.includes("Set")}
                    >
                      Set
                    </option>
                    <option
                      value="Uint8Array"
                      disabled={disabledTypeTemplates.value.includes("Uint8Array")}
                    >
                      Uint8Array
                    </option>
                  </optgroup>
                </select>
                <div>
                  <Help dialogId="typeTemplateHelp" dialogTitle="Type template">
                    <p>
                      Choose an available type from the type template dropdown and insert it into
                      the editor. This will you give you an example of the correct formatting for
                      the type.
                    </p>
                    <p class="mt-2">
                      Since the value type chosen for this KV value can potentially contain multiple
                      types, it is necessary to include the type information for each part of this
                      value. E.g. an Array can contain many elements, each of different types. Thus
                      value types which themselves can contain multiple types need type definitions
                      embedded within them. An example is{" "}
                      <code>{`{type: "Map", value: [["foo","bar"],["hello", "world"]]}`}</code>.
                    </p>
                    <p class="mt-2">
                      As a worked example, let's say your KV value is a Map whose key is a Date and
                      whose value is an Array of numbers, e.g.{" "}
                      <code>Map&lt;Date, number[]&gt;</code>. The steps to create this would be as
                      follows:
                      <ol class="mt-2 list-decimal ml-4">
                        <li>
                          Select <code>Map</code> from the <code>Value Type</code>{" "}
                          dropdown. This is the type of your KV value.
                        </li>
                        <li>
                          Select <code>Map</code> from the <code>Type template</code>{" "}
                          dropdown and click on Insert. This will insert a double-array structure of a map.
                        </li>
                        <li>
                          This template map is of type{" "}
                          <code>&lt;string, string&gt;</code>. Let's change that. Delete the key
                          {" "}
                          <code>"foo"</code> leaving the cursor where it is. Select{" "}
                          <code>Date</code> from the <code>Type template</code>{" "}
                          dropdown and choose insert. Modify the date value as needed.
                        </li>
                        <li>
                          Now delete the <code>"bar"</code>{" "}
                          value again leaving your cursor after deletion. Select <code>Array</code>
                          {"  "}from the <code>Type template</code> dropdown and click on Insert.
                        </li>
                        <li>
                          Change the default example <code>["foo", "hello"]</code> to{" "}
                          <code>[1,2,3]</code> or whatever number values you need.
                        </li>
                        <li>Use this first entry as a guide for your additional entries.</li>
                      </ol>
                    </p>
                  </Help>
                </div>
              </div>
                </div>
              <button
                type="button"
                onClick={insertTypeTemplate}
                className="btn btn-primary btn-sm ml-6"
              >
                Insert
              </button>
            </div>
          )}
        </div>
        <div class={"mt-4 w-full flex flex-col items-center pr-8 " + (props.kvValueType.value === "" ? "hidden" : "")}>
          <div
            id="editor"
            class="text-sm h-[500px] border border-primary rounded focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono w-full p-3"
          >
          </div>
        </div>
      </div>
    </div>
  );
}
