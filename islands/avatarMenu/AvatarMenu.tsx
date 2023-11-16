import { useSignal } from "@preact/signals";
import { GitHubIcon } from "../../components/svg/GitHub.tsx";
import { DeployUser } from "../../utils/denoDeploy/deployUser.ts";

export function AvatarMenu({ deployUser }: { deployUser: DeployUser }) {
  const menuVisible = useSignal(false);

  function toggleMenu() {
    menuVisible.value = !menuVisible.value;
  }

  async function signOut() {
    await fetch("/logout", { method: "POST", credentials: "include" });
    window.location.href = "/logout?authenticated=true";
  }

  return (
    <div>
      <img
        src={deployUser.avatarUrl}
        onClick={toggleMenu}
        class="w-10 h-10 rounded-full block hover:cursor-pointer"
        alt={`Avatar for ${deployUser.name}`}
      />
      <div
        class={`absolute z-50 right-[24px] top-[66px] transition-opacity ease-in-out duration-300 ${
          menuVisible.value ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div class="bg-white border border-gray-300 rounded-lg shadow-xl shadow-gray-400">
          <div class="pt-5 w-52 flex flex-col items-center">
            <img
              class="w-16 h-16 rounded-full block"
              alt={deployUser.name}
              src={deployUser.avatarUrl}
            />
            <h2 class="flex items-center gap-1.5 pt-1 text-5 font-semibold">
              {deployUser.name}
            </h2>
            <div class="flex items-center gap-1.5 text-gray-400 leading-none">
              <GitHubIcon />
              {deployUser.login}
            </div>
            <nav class="mt-4 w-full">
              <ul>
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
                  <p onClick={signOut} class="py-2.5 flex-1 cursor-pointer">Sign out</p>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
