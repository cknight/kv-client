import { JSX } from "preact";

export function CancelLocalConnectionButton() {
  function cancel(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    window.location.href = "/";
  }

  return (
    <button
      class="btn btn-secondary"
      type="submit"
      name="connectionAction"
      onClick={cancel}
      value="add"
    >
      Cancel
    </button>
  );
}
