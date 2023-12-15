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
    <div class="dropdown dropdown-end">
      <div tabIndex={0} role="button">
        <div onClick={toggleMenu}>
          <UnknownAvatarIcon />
        </div>
      </div>
      <div
        class={`absolute z-50 right-[24px] top-[66px] transition-opacity ease-in-out duration-300 ${
          menuVisible.value ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div tabIndex={0} class="dropdown-content z-[1] menu shadow bg-[#323232] rounded-box w-52">
          <div class="pt-5 w-55 flex flex-col items-center">
            <UnknownAvatarIcon />
            <nav class="mt-4 w-full">
              <ul>
                <li class="border-t border-gray-700 rounded-none flex hover:bg-[#404040]">
                  <a
                    class="py-2.5 flex-1 rounded-none"
                    href="/accessToken"
                    aria-current="page"
                  >
                    Sign in
                  </a>
                </li>
                <li class="border-t border-gray-700 rounded-none flex hover:bg-[#404040]">
                  <a
                    class="py-2.5 flex-1 rounded-none"
                    target="_blank"
                    href="https://dash.deno.com/account#access-tokens"
                    aria-current="page"
                  >
                    Access tokens
                  </a>
                </li>
                <li class="border-t border-gray-700 rounded-none flex hover:bg-[#404040]">
                  <a href="/settings" class="py-2.5 flex-1 rounded-none">Settings</a>
                </li>
                <li class="border-t border-gray-700 rounded-none flex hover:bg-[#404040]">
                  <p onClick={clearData} class="py-2.5 flex-1 cursor-pointer rounded-none">
                    Clear data
                  </p>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
