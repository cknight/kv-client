import { BUTTON } from "../consts.ts";

export function CancelAddConnectionButton() {
  function cancel() {
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={cancel}
      class={BUTTON}
    >
      Cancel
    </button>
  );
}
