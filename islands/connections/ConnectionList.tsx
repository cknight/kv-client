import { Signal } from "@preact/signals";
import { AddEditConnectionDialog } from "../../components/dialogs/AddEditConnectionDialog.tsx";
import {
  BUTTON,
  TW_TABLE,
  TW_TABLE_WRAPPER,
  TW_TBODY,
  TW_TD,
  TW_TH,
  TW_THEAD,
} from "../../consts.ts";
import { DiscoverConnectionsDialog } from "../../components/dialogs/DiscoverConnectionsDialog.tsx";
import { JSX } from "preact/jsx-runtime";
import { KvConnection, KvInstance } from "../../types.ts";

interface ConnectionListProps {
  connections: Signal<KvConnection[]>;
  localKvInstances: KvInstance[];
}

export function ConnectionList(props: ConnectionListProps) {
  function openDialog(name: string) {
    (document.getElementById(name)! as HTMLDialogElement).showModal();
  }

  function addConnection() {
    (document.getElementById("connectionName")! as HTMLInputElement).value = "";
    (document.getElementById("connectionLocation")! as HTMLInputElement).value = "";
    (document.getElementById("connectionId")! as HTMLInputElement).value = "";
    document.querySelectorAll("span[data-type='addEdit']").forEach((el) => {
      el.innerHTML = "Add";
    });
    openDialog("addEditConnectionDialog");
  }

  function editConnection(event: JSX.TargetedEvent<HTMLButtonElement, Event>, id: string) {
    event.preventDefault();
    const connection = props.connections.value.find((c) => c.id === id);
    if (connection) {
      (document.getElementById("connectionName")! as HTMLInputElement).value = connection.name;
      (document.getElementById("connectionLocation")! as HTMLInputElement).value =
        connection.kvLocation;
      (document.getElementById("connectionId")! as HTMLInputElement).value = connection.id;
      document.querySelectorAll("span[data-type='addEdit']").forEach((el) => {
        el.innerHTML = "Edit";
      });
      openDialog("addEditConnectionDialog");
    }
  }

  return (
    <>
      <div class={TW_TABLE_WRAPPER}>
        <table class={TW_TABLE}>
          <thead class={TW_THEAD}>
            <tr>
              <th class={TW_TH}>Name</th>
              <th class={TW_TH}>Connection</th>
              <th class={TW_TH}></th>
            </tr>
          </thead>
          <tbody class={TW_TBODY}>
            {props.connections.value.map((connection) => (
              <tr>
                <td class={TW_TD + " w-1/4"}>{connection.name}</td>
                <td class={TW_TD}>{connection.kvLocation}</td>
                <td class={TW_TD}>
                  <div>
                    <form method="post">
                      <button
                        name="connectionAction"
                        value="edit"
                        onClick={(e) => editConnection(e, connection.id)}
                      >
                        Edit
                      </button>
                      <input type="hidden" name="connectionId" value={connection.id} />
                      <button type="submit" name="connectionAction" value="delete">Delete</button>
                      <button type="submit" name="connectionAction" value="test">Test</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div class="flex justify-center">
        <button class={BUTTON} onClick={addConnection}>Add</button>
        <button class={BUTTON} onClick={() => openDialog("discoverConnectionsDialog")}>
          Discover
        </button>
      </div>
      <AddEditConnectionDialog />
      <DiscoverConnectionsDialog kvInstances={props.localKvInstances} />
    </>
  );
}
