import { JSX } from "preact";
import { Chip } from "../../components/Chip.tsx";
import { ConnectionInfoDialog } from "../../components/dialogs/ConnectionInfoDialog.tsx";
import { InfoIcon } from "../../components/svg/Info.tsx";
import { XIcon } from "../../components/svg/XIcon-red.tsx";
import { Environment } from "../../types.ts";
import { readableSize } from "../../utils/utils.ts";

export interface ConnectionCardProps {
  name: string;
  id: string;
  size: number;
  environment: Environment;
  organisation: string | undefined;
  location: string;
  session: string;
}

export function ConnectionCard(props: ConnectionCardProps) {
  function getEnvironmentColor() {
    switch (props.environment) {
      case "local":
        return "bg-green-700";
      case "Deploy prod":
        return "bg-red-700";
      case "Deploy preview":
        return "bg-yellow-700";
      case "Deploy playground":
        return "bg-purple-700";
      case "self-hosted":
        return "bg-pink-700";
      default:
        return "bg-blue-700";
    }
  }

  function getEnvironment() {
    switch (props.environment) {
      case "local":
        return "Local";
      case "Deploy prod":
        return "Production";
      case "Deploy preview":
        return "Preview";
      case "Deploy playground":
        return "Playground";
      case "self-hosted":
        return "Self-hosted";
      default:
        return "Other";
    }
  }

  function removeLocalConnection(event: JSX.TargetedEvent<HTMLDivElement, MouseEvent>) {
    event.stopPropagation(); //e.g. don't connect
    const dialog = document.getElementById("removeLocalConnectionDialog")! as HTMLDialogElement;
    document.getElementById("removeLocalConnectionName")!.textContent = props.name;
    document.getElementById("removeLocalConnectionId")!.setAttribute("value", props.id);
    dialog.showModal();
  }

  function useConnection() {
    window.location.href = "/get?connectionId=" + props.id;
  }

  return (
    <div class="connectionCard">
      <button
        onClick={useConnection}
      >
        <div class="flex flex-col min-w-[250px] justify-between bg-[#353535] hover:bg-[#404040] border-gray-300 m-3 rounded-lg shadow border-1 hover:cursor-pointer p-4">
          <div class="flex">
            <h1 class="text-lg font-bold leading-tight tracking-tight md:text-xl">
              {props.name}
            </h1>
          </div>
          <div class="flex flex-wrap">
            <Chip name={getEnvironment()} bgColor={getEnvironmentColor()} />
            {props.organisation && (
              <Chip name={"Org: " + props.organisation} bgColor="bg-blue-700" />
            )}
          </div>
          <div id="actionRow" class="flex items-center justify-between mt-3">
            {props.environment === "local" || props.environment === "self-hosted"
              ? (
                <div onClick={removeLocalConnection}>
                  <XIcon title="Remove connection" />
                </div>
              )
              : <div></div>}
            {props.size != -1 &&
              (
                <div class="flex justify-center items-center">
                  <p class="text-xl">{readableSize(props.size)}</p>
                </div>
              )}
            <div class="flex">
              <InfoIcon
                title="View details"
                onClick={(e) => {
                  // Your click handler code here
                  e.stopPropagation();
                  const dialog = document.getElementById(
                    props.id + "_connection_info_dialog",
                  ) as HTMLDialogElement;
                  dialog.showModal();
                  dialog.classList.add("modal");
                }}
              />
            </div>
          </div>
        </div>
      </button>
      <ConnectionInfoDialog {...props} />
    </div>
  );
}
