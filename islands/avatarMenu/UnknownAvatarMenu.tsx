import { useSignal } from "@preact/signals";
import { UnknownAvatarIcon } from "../../components/svg/UnknownAvatar.tsx";

export function UnknownAvatarMenu() {
  const menuVisible = useSignal(false);

  function toggleMenu() {
    menuVisible.value = !menuVisible.value;
  }

  async function clearData() {
    await fetch("/logout", { method: "POST", credentials: "include" });
    window.location.href = "/logout";
  }

  return (
    <div>
      <div onClick={toggleMenu}>
        <UnknownAvatarIcon />
      </div>
      <div
        class={`absolute z-50 right-[24px] top-[66px] transition-opacity ease-in-out duration-300 ${
          menuVisible.value ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div class="bg-white border border-gray-300 rounded-lg shadow-xl shadow-gray-400">
          <div class="pt-5 w-52 flex flex-col items-center">
            <UnknownAvatarIcon />
            <nav class="mt-4 w-full">
              <ul>
                <li class="px-4 border-t-1 border-gray-200 flex hover:bg-gray-100">
                  <a
                    class="py-2.5 flex-1"
                    href="/accessToken"
                    aria-current="page"
                  >
                    Sign in
                  </a>
                </li>
                <li class="px-4 border-t-1 border-gray-200 flex hover:bg-gray-100">
                  <a
                    class="py-2.5 flex-1"
                    target="_blank"
                    href="https://dash.deno.com/account#access-tokens"
                    aria-current="page"
                  >
                    Access tokens
                  </a>
                </li>
                <li class="px-4 border-t-1 border-gray-200 flex hover:bg-gray-100">
                  <a href="/settings" class="py-2.5 flex-1">Settings</a>
                </li>
                <li class="px-4 border-t-1 border-gray-200 flex hover:bg-gray-100">
                  <p onClick={clearData} class="py-2.5 flex-1 cursor-pointer">Clear data</p>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
