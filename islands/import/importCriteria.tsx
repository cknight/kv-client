import { useSignal } from "@preact/signals";
import { JSX } from "preact/jsx-runtime";
import { Caution } from "../../components/Caution.tsx";
import { ToastType } from "../../types.ts";
import { Connections } from "../../utils/connections/connections.ts";
import { Toast } from "../Toast.tsx";

interface ImportCriteriaProps {
  error?: string;
  connections: Connections;
  connectionId: string;
}

export function ImportCriteria(props: ImportCriteriaProps) {
  const showToastSignal = useSignal(props.error ? true : false);
  const toastMsg = useSignal(props.error || "");
  const toastType = useSignal<ToastType>("error");
  const isProd =
    props.connections.remote.find((conn) => conn.id === props.connectionId)?.environment ===
      "Deploy prod";
  const isImporting = useSignal(false);
  const importFrom = useSignal("");
  const connection = props.connections.remote.concat(
    props.connections.local,
    props.connections.selfHosted,
  )
    .find((conn) => conn.id === props.connectionId);
  const connectionName = `${connection?.name} (${connection?.environment})`;
  const abortId = useSignal(crypto.randomUUID());

  function importFromChange(event: JSX.TargetedEvent<HTMLSelectElement, Event>) {
    importFrom.value = event.currentTarget.value;
  }

  function abortImport(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();

    fetch("/api/abort", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: abortId.value,
    }).then((_resp) => {
      console.log("Aborting import");
      showToast("Export aborted", "warn");
    }).catch((e) => {
      console.error("Failure with abort request", e);
      showToast("An unexpected error occurred: Unable to abort request", "error");
    });
  }

  function resetForm(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const form = document.getElementById("pageForm")! as HTMLFormElement;
    form.reset();
    importFrom.value = "";
  }

  function executeImport(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const form = document.getElementById("pageForm")! as HTMLFormElement;

    if (form.checkValidity()) {
      isImporting.value = true;
      document.body.style.cursor = "progress";
      const formData = new FormData(form);
      fetch("/api/import", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          response.text().then((text) => {
            console.log(text);
            if (response.status === 200) {
              showToast(text, "info");
            } else if (response.status < 500) {
              // e.g. aborted copy
              showToast(text, "warn");
            } else {
              // unexpected error
              showToast(text, "error");
            }
          }).catch((e) => {
            console.error("Error while parsing response text", e);
            showToast("An unexpected error occurred: Unable to read response", "error");
          });
        })
        .catch((e) => {
          showToast(`Import failed: ${e.message}`, "error");
        })
        .finally(() => {
          isImporting.value = false;
          document.body.style.cursor = "default";
        });
    } else {
      form.reportValidity();
    }
  }

  function showToast(msg: string, type: ToastType) {
    toastMsg.value = msg;
    toastType.value = type;
    showToastSignal.value = true;
  }

  function connectionList(): Map<string, { name: string; id: string }[]> {
    const envMap = new Map<string, { name: string; id: string }[]>();
    props.connections.local?.forEach((connection) => {
      if (connection.id === props.connectionId) return;

      if (!envMap.has(connection.environment)) {
        envMap.set(connection.environment, []);
      }
      envMap.get(connection.environment)!.push({ name: connection.name, id: connection.id });
    });

    props.connections.remote?.forEach((connection) => {
      if (connection.id === props.connectionId) return;

      if (!envMap.has(connection.environment)) {
        envMap.set(connection.environment, []);
      }
      envMap.get(connection.environment)!.push({ name: connection.name, id: connection.id });
    });

    props.connections.selfHosted?.forEach((connection) => {
      if (connection.id === props.connectionId) return;

      if (!envMap.has(connection.environment)) {
        envMap.set(connection.environment, []);
      }
      envMap.get(connection.environment)!.push({ name: connection.name, id: connection.id });
    });

    envMap.forEach((connections, env) => {
      envMap.set(env, connections.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return envMap;
  }
  const connList = connectionList();

  return (
    <div class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3">
      <div>
        <h1 class="text-2xl font-bold">
          Import
        </h1>
        <div class="flex flex-row items-center mt-4">
          <label for="importFrom" class="mr-4">
            Import all data from
          </label>
          <select
            id="importFrom"
            class="select select-primary"
            required
            onChange={importFromChange}
          >
            <option value="" disabled selected>Please select</option>
            <option value="file">File (KV SQLite)</option>
            <option value="connection">Existing Connection</option>
          </select>
          <p class="ml-3">
            into <code>{connectionName}</code>
          </p>
        </div>
        {importFrom.value === "file" && (
          <div class="mt-4 flex flex-row items-center">
            <label for="importFile" class="mr-4">
              File
            </label>
            <input
              id="importFile"
              name="importFile"
              type="file"
              required
              class="file-input file-input-bordered file-input-primary w-[550px]"
            />
          </div>
        )}
        {importFrom.value === "connection" && (
          <>
            <div class="mt-4">
              <label for="connection" class="mr-4">
                Source
              </label>
              <select id="connection" name="importSource" class="select select-primary" required>
                <option value="" disabled selected>Please select</option>
                {Array.from(connList.keys()).map((env) => (
                  <optgroup label={env}>
                    {connList.get(env)!.map((connection) => (
                      <option value={connection.id}>{connection.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <Caution>
              <div class="flex flex-col">
                <p class="text-yellow-500 ml-2">Caution:</p>
                <ul class="text-yellow-500 list-disc">
                  <li>Any existing keys will be overwritten</li>
                  <li>
                    Consistency may not be guaranteed (<a
                      href="https://kv-client.dev/docs/consistency-and-caching"
                      target="_blank"
                      class="link text-blue-400"
                    >
                      more info
                    </a>)
                  </li>
                </ul>
              </div>
            </Caution>
          </>
        )}
        {isProd && (
          <Caution>
            <p class="text-yellow-500 ml-2 break-all">
              Caution: Data will be written to a production environment
            </p>
          </Caution>
        )}
        <input type="hidden" value={abortId.value} name="abortId" />
        <input type="hidden" value={props.connectionId} name="connectionId" />
      </div>
      <div class="flex w-full justify-center gap-x-4 mt-8">
        {isImporting.value
          ? <button class="btn btn-secondary" onClick={abortImport}>Abort</button>
          : (
            <>
              <button
                type="reset"
                onClick={resetForm}
                class="btn btn-secondary"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={executeImport}
                class="btn btn-primary"
              >
                Import
              </button>
            </>
          )}
      </div>
      <Toast
        id="importToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </div>
  );
}
