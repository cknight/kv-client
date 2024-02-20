import { useSignal } from "@preact/signals";
import { EyeIcon } from "../components/svg/Eye.tsx";
import { NoEyeIcon } from "../components/svg/NoEye.tsx";
import { Help } from "./Help.tsx";

export function SelfHostedAccessTokenInput() {
  const showPassword = useSignal(false);

  function togglePassword() {
    showPassword.value = !showPassword.value;
  }

  return (
    <div class="flex flex-row w-full items-center">
      <label
        for="accessToken"
        class="inline-block mr-3 w-28 mb-2 text-sm font-medium"
      >
        Access Token
      </label>
      <div class="relative w-full">
        <input
          type={showPassword.value ? "text" : "password"}
          name="accessToken"
          id="accessToken"
          class="input input-primary w-full p-2"
          required
        />
        <button
          type="button"
          class="absolute inset-y-0 right-0 px-3 py-2.5"
          aria-label="Toggle password visibility"
          onClick={togglePassword}
        >
          {showPassword.value ? <NoEyeIcon /> : <EyeIcon />}
        </button>
      </div>
      <Help dialogId="accessTokenHelp" dialogTitle="Access Token">
        <div>
          Self-hosted KV stores require an access token to be able to connect. This is separate from
          the access tokens generated in Deno Deploy dashboard and are set when creating the
          self-hosted instance.
        </div>
      </Help>
    </div>
  );
}
