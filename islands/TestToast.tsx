import { signal } from "@preact/signals";
import { Toast } from "./Toast.tsx";

export function ToastTest() {
  const fadeSignal = signal(false);

  return (
    <div>
      <button onClick={() => fadeSignal.value = true}>Show Toast</button>
      <Toast
        show={fadeSignal}
        id="toast1"
        message="An unexpected error occurred: Unable to read response. An unexpected error occurred: Unable to read response. An unexpected error occurred: Unable to read response. An unexpected error occurred: Unable to read response. An unexpected error occurred: Unable to read response"
        type="warn"
      />
    </div>
  );
}
