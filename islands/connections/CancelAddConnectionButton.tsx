export function CancelAddConnectionButton() {
  function cancel() {
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={cancel}
      class="btn btn-primary"
    >
      Cancel
    </button>
  );
}
