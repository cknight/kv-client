import { useSignal } from "@preact/signals";
import { GitHubIcon } from "../../components/svg/GitHub.tsx";
import { DeployUser } from "../../utils/user/denoDeploy/deployUser.ts";

export function AvatarMenu({ deployUser }: { deployUser: DeployUser }) {
  const menuVisible = useSignal(false);
  const lastToggle = useSignal(0);

  function toggleMenu() {
    if (Date.now() - lastToggle.value < 500) return;

    menuVisible.value = !menuVisible.value;
    lastToggle.value = Date.now();
  }

  async function signOut() {
    await fetch("/logout", { method: "POST", credentials: "include" });
    window.location.href = "/logout?authenticated=true";
  }

  return (
    <div class="dropdown dropdown-end">
      <button onFocus={toggleMenu} onClick={toggleMenu}>
        <img
          src={deployUser.avatarUrl}
          class="w-10 h-10 rounded-full block hover:cursor-pointer"
          alt={`Avatar for ${deployUser.name}`}
        />
      </button>{" "}
      <div
        class={`absolute z-50 right-[24px] top-[66px] transition-opacity ease-in-out duration-300 ${
          menuVisible.value ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div class="dropdown-content z-[1] menu shadow bg-[#323232] rounded-box w-52">
          <div class="pt-5 w-55 flex flex-col items-center">
            <img
              class="w-16 h-16 rounded-full block"
              alt={deployUser.name}
              src={deployUser.avatarUrl}
            />
            <h2 class="flex items-center gap-1.5 pt-1 text-5 font-semibold mt-2">
              {deployUser.name}
            </h2>
            <div class="flex items-center gap-1.5 text-gray-400 leading-none mt-2">
              <GitHubIcon />
              {deployUser.login}
            </div>
            <nav class="mt-4 w-full">
              <ul>
                <li class="border-t border-gray-700 rounded-none flex hover:bg-[#404040]">
                  <a
                    class="py-2.5 flex-1 rounded-none"
                    target="_blank"
                    href="https://dash.deno.com/account#access-tokens"
                    aria-current="page"
                  >
                    Deploy access tokens
                  </a>
                </li>
                <li class="border-t border-gray-700 flex rounded-none hover:bg-[#404040]">
                  <a
                    href="https://kv-client.dev/docs/category/connections"
                    target="_blank"
                    class="py-2.5 flex-1 rounded-none"
                  >
                    Docs
                  </a>
                </li>
                {
                  /* <li class="border-t border-gray-700 flex rounded-none hover:bg-[#404040]">
                  <a href="/settings" class="py-2.5 flex-1 rounded-none">Settings</a>
                </li> */
                }
                <li class="border-t border-gray-700 rounded-none flex hover:bg-[#404040]">
                  <button onClick={signOut} class="py-2.5 flex-1 rounded-none cursor-pointer">
                    Sign out
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
