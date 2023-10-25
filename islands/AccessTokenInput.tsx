import { useSignal } from "@preact/signals";
import { EyeIcon } from "../components/svg/Eye.tsx";
import { NoEyeIcon } from "../components/svg/NoEye.tsx";

export function AccessTokenInput() {
  const showPassword = useSignal(false);

  function togglePassword() {
    console.log("togglePassword");
    showPassword.value = !showPassword.value;
  }

  return (
    <div>
      <label
        for="accessToken"
        class="block mb-2 text-sm font-medium text-gray-900"
      >
        Access Token
      </label>
      <div class="relative">
        <input
          type={showPassword.value ? "text" : "password"}
          name="accessToken"
          id="accessToken"
          class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
          placeholder="Deno Deploy Access Token"
          required
        />
        <button
          type="button"
          class="absolute inset-y-0 right-0 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-700 focus:outline-none"
          onClick={togglePassword}
        >
          {showPassword.value ? <NoEyeIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}
