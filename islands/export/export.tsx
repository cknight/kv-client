import { useSignal } from "@preact/signals";
import { JSX } from "preact/jsx-runtime";
import { Caution } from "../../components/Caution.tsx";
import { ExportStatus, ToastType } from "../../types.ts";
import { Connections } from "../../utils/connections/connections.ts";
import { Toast } from "../Toast.tsx";

interface ExportCriteriaProps {
  connectionId: string;
  connections: Connections;
}

export function ExportCriteria(props: ExportCriteriaProps) {
  const showToastSignal = useSignal(false);
  const toastMsg = useSignal("");
  const toastType = useSignal<ToastType>("error");
  const isExporting = useSignal(false);
  const progress = useSignal(0);
  const keysExported = useSignal(0);
  const starting = useSignal(false);
  let statusIntervalId = 0;
  let statusCheckErrors = 0;

  const connection = props.connections.remote.concat(
    props.connections.local,
    props.connections.selfHosted,
  ).find((conn) => conn.id === props.connectionId);
  const sourceSize = connection?.size || -1;

  const connectionName = `${connection?.name} (${connection?.environment})`;
  const exportId = useSignal(crypto.randomUUID());

  function abortExport(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();

    fetch("/api/abort", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: exportId.value,
    }).then((_resp) => {
      console.log("Aborting export");
    }).catch((e) => {
      console.error("Failure with abort request", e);
      showToast("An unexpected error occurred: Unable to abort request", "error");
    });
  }

  function resetForm(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const form = document.getElementById("pageForm")! as HTMLFormElement;
    form.reset();
  }

  function executeExport(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    const form = document.getElementById("pageForm")! as HTMLFormElement;

    isExporting.value = true;
    document.body.style.cursor = "progress";
    const formData = new FormData();
    formData.append("exportId", exportId.value);
    formData.append("connectionId", props.connectionId);

    fetch("/api/export/initiate", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        response.text().then((text) => {
          checkStatusAndDownloadExportWhenComplete();
        }).catch((e) => {
          console.error("Error while parsing response text", e);
          showToast("An unexpected error occurred: Unable to read response", "error");
        });
      })
      .catch((e) => {
        showToast(`Export failed: ${e.message}`, "error");
      });
  }

  function checkStatusAndDownloadExportWhenComplete() {
    statusIntervalId = setInterval(() => {
      fetch(`/api/export/status?exportId=${exportId.value}`)
        .then((response) => response.json())
        .then((status) => {
          const exportStatus = status as ExportStatus;
          if (exportStatus.status === "in progress") {
            if (!starting.value) {
              starting.value = true;
            }

            if (sourceSize > 0) {
              progress.value = Math.round(((exportStatus.bytesProcessed) / sourceSize) * 100);
            }
            keysExported.value = exportStatus.keysProcessed;
            return;
          } else if (exportStatus.status === "initiating") {
            starting.value = true;
            return;
          } else if (exportStatus.status === "complete") {
            clearInterval(statusIntervalId);
            downloadExport(exportId.value);
            showToast("Export complete", "info");
          } else if (exportStatus.status === "failed") {
            clearInterval(statusIntervalId);
            showToast(`Export failed: ${status.error}`, "error");
          } else if (exportStatus.status === "aborted") {
            clearInterval(statusIntervalId);
            showToast("Export aborted", "warn");
          }
        })
        .catch((e) => {
          console.error("Error while checking export status", e);
          if (statusCheckErrors++ > 100) {
            clearInterval(statusIntervalId);
            (document.getElementById("abortBtn") as HTMLButtonElement).click();
            showToast(
              "An unexpected error occurred: Unable to check export status, aborting",
              "error",
            );
          }
        });
    }, 100);
  }

  function downloadExport(exportId: string) {
    const a = document.createElement("a");
    a.href = `/api/export/download?exportId=${exportId}`;
    a.download = `${connectionName.replaceAll(" ", "_")}-export-${new Date().toISOString()}.sqlite`;
    a.click();
    a.remove();
  }

  function showToast(msg: string, type: ToastType) {
    toastMsg.value = msg;
    toastType.value = type;
    showToastSignal.value = true;
    isExporting.value = false;
    document.body.style.cursor = "default";
  }

  return (
    <div class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3">
      <div>
        <h1 class="text-2xl font-bold">
          Export
        </h1>
        <div class="flex flex-row items-center mt-4">
          <p>
            Export all data from <code>{connectionName}</code> to a file.
          </p>
        </div>
        <Caution>
          <p class="text-yellow-500 ml-2">
            Caution: This export does not provide consistency guarantees for KV stores with more
            than 500 keys. See{" "}
            <a
              href="https://kv-client.dev/docs/consistency-and-caching"
              target="_blank"
              class="link"
            >
              docs
            </a>{" "}
            for more info.
          </p>
        </Caution>
      </div>
      {isExporting.value && (
        <div class="flex flex-col w-full justify-center items-center mt-6">
          {sourceSize < 1 ? <progress class="progress progress-secondary w-96"></progress> : (
            <div
              class="radial-progress text-secondary"
              style={"--value:" + progress.value}
              role="progressbar"
            >
              {progress.value}%
            </div>
          )}
          <p class="mt-4">{keysExported.value} keys exported</p>
        </div>
      )}
      <div class="flex w-full justify-center gap-x-4 mt-8">
        {isExporting.value
          ? <button id="abortBtn" class="btn btn-secondary" onClick={abortExport}>Abort</button>
          : (
            <button
              type="button"
              onClick={executeExport}
              class="btn btn-primary"
            >
              Export
            </button>
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
