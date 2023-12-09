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
      class="btn btn-primary"
    >
      Add Local
    </button>
  );
}
