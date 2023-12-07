import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { BUTTON } from "../consts.ts";
import { Help } from "./Help.tsx";

export function KvValueEditor() {
  // deno-lint-ignore no-explicit-any
  const editor = useSignal<any>(null);
  const disabledTypeTemplates = useSignal<string[]>([]);
  const selectedType = useSignal("");

  function initAce() {
    //@ts-ignore - ace is a global export from ace.js
    editor.value = ace.edit("editor");
    document.querySelector("#editor textarea")!.id = "kvValue";
    editor.value.setOptions({
      printMargin: false,
      readOnly: false,
    });
    editor.value.session.setMode("ace/mode/json5");
    editor.value.session.placeholder = "Hello world";
    // if (document.querySelector('html.dark')) {
    //   editor.value.setTheme("ace/theme/idle_fingers")
    // }
    editor.value.getSession().setUseWrapMode(true);
    // editor.value.on("changeStatus", updateLineCol);
    // editor.value.on("changeSelection", updateLineCol);
    // editor.value.on("keyboardActivity", updateLineCol);

    //@ts-ignore - For browser console testing
    globalThis.editor = editor.value;
  }

  function insertTypeTemplate(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const typeHelper = (document.getElementById("typeHelper") as HTMLSelectElement).value;
    const valueType = (document.getElementById("valueType") as HTMLSelectElement).value;
    if (typeHelper === "") return;

    const cursor = editor.value.getCursorPosition();
    const session = editor.value.session;
    if (typeHelper === "Uint8Array") {
      session.insert(
        cursor,
        valueType === "Uint8Array"
          ? `[255, 1, 2, 163]`
          : `{ type: "Uint8Array", value: [255, 1, 2, 163] }`,
      );
    } else if (typeHelper === "KvU64") {
      session.insert(
        cursor,
        valueType === "KvU64"
          ? `12345678901234567890`
          : `{ type: "KvU64", value: "12345678901234567890" }`,
      );
    } else if (typeHelper === "JSON") {
      session.insert(
        cursor,
        valueType === "JSON"
          ? `{ "foo": "bar", "hello": true }`
          : `'{ "foo": "bar", "hello": true }'`,
      );
    } else if (typeHelper === "Date") {
      session.insert(
        cursor,
        valueType === "Date"
          ? new Date().toISOString()
          : `{ type: "Date", value: "${new Date().toISOString()}" }`,
      );
    } else if (typeHelper === "RegExp") {
      session.insert(
        cursor,
        valueType === "RegExp" ? `/^foo/` : `{ type: "RegExp", value: "/^foo/" }`,
      );
    } else if (typeHelper === "Map") {
      session.insert(
        cursor,
        valueType === "Map"
          ? `[["foo","bar"],["hello", "world"]]`
          : `{ type: "Map", value: [["foo","bar"],["hello", "world"]] }`,
      );
    } else if (typeHelper === "Set") {
      session.insert(
        cursor,
        valueType === "Set" ? `["foo", "hello"]` : `{ type: "Set", value: ["foo", "hello"] }`,
      );
    } else if (typeHelper === "Array") {
      session.insert(cursor, `["foo", "hello"]`);
    } else if (typeHelper === "Object") {
      session.insert(cursor, `{ foo: "bar" }`);
    } else if (typeHelper === "true" || typeHelper === "false" || typeHelper === "null") {
      session.insert(cursor, typeHelper);
    } else if (typeHelper === "string") {
      session.insert(cursor, valueType === "string" ? `foo` : `"foo"`);
    } else if (typeHelper === "number") {
      session.insert(cursor, `123`);
    } else if (typeHelper === "bigint") {
      session.insert(
        cursor,
        valueType === "bigint" ? `1234213421352n` : `{ type: "bigint", value: "1234213421352" }`,
      );
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

  function updateTypeChosen() {
    const value = (document.getElementById("valueType") as HTMLSelectElement).value;
    selectedType.value = value;

    const allTypes = [
      "bigint",
      "boolean",
      "null",
      "number",
      "string",
      "Array",
      "Date",
      "JSON",
      "KvU64",
      "Map",
      "Object",
      "RegExp",
      "Set",
      "Uint8Array",
    ];

    if (value === "Array" || value === "Map" || value === "Object" || value === "Set") {
      disabledTypeTemplates.value = [];
    } else {
      disabledTypeTemplates.value = allTypes.filter((t) => t !== value);
    }

    setTimeout(() => {
      (document.getElementById("typeHelper") as HTMLSelectElement).value = value;
    }, 0);
  }

  return (
    <div class="flex flex-col w-full h-full mt-8">
      <h1 class="text-2xl font-bold">Value</h1>
      <div class="flex flex-row h-full w-full">
        <div class="mt-4 h-full w-52 flex flex-col justify-between">
          <div>
            <label for="valueType" class="w-24 font-semibold">Value Type</label>
            <div class="flex flex-col justify-left">
              <div class="flex">
                <select id="valueType" class="rounded bg-blue-100 p-2" onChange={updateTypeChosen}>
                  <option value="" disabled={true} selected={true}>Please select</option>
                  <optgroup label="Primitive types">
                    <option value="bigint">bigint</option>
                    <option value="boolean">boolean</option>
                    <option value="null">null</option>
                    <option value="number">number</option>
                    <option value="string">string</option>
                  </optgroup>
                  <optgroup label="Complex types">
                    <option value="Array">Array</option>
                    <option value="Date">Date</option>
                    <option value="JSON">JSON</option>
                    <option value="KvU64">KvU64</option>
                    <option value="Map">Map</option>
                    <option value="Object">Object</option>
                    <option value="RegExp">RegExp</option>
                    <option value="Set">Set</option>
                    <option value="Uint8Array">Uint8Array</option>
                  </optgroup>
                </select>
              </div>
            </div>
            {selectedType.value !== "" && (
              <div class="mt-4">
                <label for="typeHelper" class="w-24 font-semibold">Type templates</label>
                <div class="flex flex-col justify-left">
                  <div class="flex">
                    <select id="typeHelper" class="rounded bg-blue-100 p-2">
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
                        <option value="Map" disabled={disabledTypeTemplates.value.includes("Map")}>
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
                        <option value="Set" disabled={disabledTypeTemplates.value.includes("Set")}>
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
                    <div class="mt-1">
                      <Help dialogId="typeTemplateHelp" dialogTitle="Type template">
                        <p>
                          Choose an available type from the type template dropdown and insert it
                          into the editor. This will you give you an example of the correct
                          formatting for the type.
                        </p>
                        <p class="mt-2">
                          Note that some types have shorthand notation which can be used if the
                          value type matches the template, but a longer type notation may be
                          required when used in an object, Array, Map, etc.
                        </p>
                      </Help>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={insertTypeTemplate}
                    className={BUTTON + " w-[90px] justify-center ml-0 mt-2"}
                  >
                    {"Insert ->"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div class="mt-4 h-full w-full flex items-center pr-8">
          <div class="h-full w-full">
            <div class="flex h-full">
              <div
                id="editor"
                class="text-sm h-full max-h-full border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono w-full p-3"
              >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
