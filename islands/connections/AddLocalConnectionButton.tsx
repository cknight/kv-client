import { JSX } from "preact";

export function AddLocalConnectionButton() {
  function addLocalConnection(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    window.location.href = "/addLocalConnection";
  }

  return (
    <button
      type="button"
      onClick={addLocalConnection}
      class="inline-flex items-center justify-center text-md px-4 py-2 mx-2 rounded-md shadow-sm font-medium text-white bg-blue-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 w-40"
    >
      Add Local
    </button>
  );
}
