import { JSX } from "preact/jsx-runtime";
import { ConnectionCardProps } from "../../islands/connections/ConnectionCard.tsx";
import { readableSize } from "../../utils/utils.ts";

export function ConnectionInfoDialog(props: ConnectionCardProps) {
  function close(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault(); //e.g. don't submit the form
    const dialog = document.getElementById(
      props.id + "_connection_info_dialog",
    )! as HTMLDialogElement;
    dialog.close();
    dialog.classList.remove("modal");
  }

  return (
    <dialog
      id={props.id + "_connection_info_dialog"}
      class=""
    >
      <div class="modal-box mb-3">
        <p class="font-bold text-xl">
          Connection Info
        </p>
        <div class="divider"></div>

        <table>
          <tbody>
            <tr>
              <td class="w-32 py-2 font-bold">Name</td>
              <td class="break-all whitesapce-normal">{props.name}</td>
            </tr>
            <tr>
              <td class="w-32 py-2 font-bold">Environment</td>
              <td class="break-all whitesapce-normal">{props.environment}</td>
            </tr>
            {props.organisation && (
              <tr>
                <td class="w-32 py-2 font-bold">Organisation</td>
                <td class="break-all whitesapce-normal">{props.organisation}</td>
              </tr>
            )}
            <tr>
              <td class="w-32 py-2 font-bold">Location</td>
              <td class="break-all whitesapce-normal">{props.location}</td>
            </tr>
            <tr>
              <td class="w-32 py-2 font-bold">Estimated size</td>
              <td class="break-all whitesapce-normal">
                {props.size < 0 ? "Unknown" : readableSize(props.size)}
              </td>
            </tr>
            <tr>
              <td class="w-32 py-2 font-bold">Id</td>
              <td class="break-all whitesapce-normal">{props.id}</td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-center mt-4">
          <button class="btn btn-primary" onClick={close}>OK</button>
        </div>
      </div>
    </dialog>
  );
}
