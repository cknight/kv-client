import { Signal } from "@preact/signals";
import { KvConnection } from "../types.ts";

interface ConnectionDropDownProps {
  connections: Signal<KvConnection[]>;
}

export function ConnectionDropDown(props: ConnectionDropDownProps) {
  function updateConnection() {
    const connectionId =
      (document.getElementById("connection")! as HTMLSelectElement).value;
    fetch("/api/connectionChange?connection=" + connectionId, {
      method: "POST",
      headers: { "Accept": "text/plain", "Content-Type": "text/plain" },
    }).catch((error) => {
      //TODO Add retry logic here and UI notification
      console.error(error);
    });
  }

  return (
    <div class="flex items-center">
      <label for="connection" class="text-xl font-bold">Connection:</label>
      <select
        id="connection"
        name="connection"
        class="rounded bg-blue-100 mx-2 p-2"
        onChange={updateConnection}
      >
        <option value="" disabled selected>Select a connection</option>
        {props.connections.value.length > 0
          ? (
            props.connections.value.map((connection) => (
              <option value={connection.id} label={connection.name}>
                {connection.name}
              </option>
            ))
          )
          : <option disabled value="">Create a connection</option>}
      </select>
      <svg height="25" width="25" viewBox="0 0 128 128">
        <path d="M64,0a64,64,0,1,0,64,64A64.07,64.07,0,0,0,64,0Zm0,122a58,58,0,1,1,58-58A58.07,58.07,0,0,1,64,122Z" />
        <path d="M90,61H67V38a3,3,0,0,0-6,0V61H38a3,3,0,0,0,0,6H61V90a3,3,0,0,0,6,0V67H90a3,3,0,0,0,0-6Z" />
      </svg>
    </div>
  );
}
