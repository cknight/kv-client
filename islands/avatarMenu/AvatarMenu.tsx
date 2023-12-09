import { useSignal } from "@preact/signals";
import { GitHubIcon } from "../../components/svg/GitHub.tsx";
import { DeployUser } from "../../utils/connections/denoDeploy/deployUser.ts";

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
    <div class="dropdown dropdown-end">
      <div tabIndex={0} role="button">
        <img
          src={deployUser.avatarUrl}
          onClick={toggleMenu}
          class="w-10 h-10 rounded-full block hover:cursor-pointer"
          alt={`Avatar for ${deployUser.name}`}
        />
      </div>
      <div tabIndex={0} class="dropdown-content z-[1] menu shadow bg-[#323232] rounded-box w-52">
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
                  Access tokens
                </a>
              </li>
              <li class="border-t border-gray-700 flex rounded-none hover:bg-[#404040]">
                <a href="/settings" class="py-2.5 flex-1 rounded-none">Settings</a>
              </li>
              <li class="border-t border-gray-700 rounded-none flex hover:bg-[#404040]">
                <p onClick={signOut} class="py-2.5 flex-1 rounded-none cursor-pointer">Sign out</p>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
