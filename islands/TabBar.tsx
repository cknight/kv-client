import { signal } from "@preact/signals";
import { state } from "../utils/state.ts";
import { IS_BROWSER } from "$fresh/runtime.ts";

export interface TabBarProps {
  tab: string;
}

export function TabBar(props: TabBarProps) {
  const activeTabClasses = "border-b-4 border-blue-700 text-blue-600";
  const inactiveTabClasses = "text-gray-600";

  return (
    <ul class="w-full mt-2 flex justify-center flex-wrap border-b border-gray-500">
      <li class="mr-2" aria-current={state.activeTab.value === "search" ? "page" : "false"}>
        <a href="search" id="search" class={`tab inline-block hover:text-blue-600 py-2 px-4 text-lg font-medium text-center ` + (props.tab === "search" ? activeTabClasses : inactiveTabClasses)}>Search</a>
      </li>
      <li class="mr-2" aria-current={state.activeTab.value === "delete" ? "page" : "false"}>
        <a href="delete" id="delete" class={"tab inline-block hover:text-blue-600 py-2 px-4 text-lg font-medium text-center " + (props.tab === "delete" ? activeTabClasses : inactiveTabClasses)}>Delete</a>
      </li>
      <li class="mr-2" aria-current={state.activeTab.value === "insertUpdate" ? "page" : "false"}>
        <a href="insertUpdate" id="insertUpdate" class={"tab inline-block hover:text-gray-600 py-2 px-4 text-lg font-medium text-center " + (props.tab === "insertUpdate" ? activeTabClasses : inactiveTabClasses)}>Insert/Update</a>
      </li>
      <li class="mr-2" aria-current={state.activeTab.value === "connections" ? "page" : "false"}>
        <a href="connections" id="connections" class={"tab inline-block hover:text-gray-600 py-2 px-4 text-lg font-medium text-center " + (props.tab === "connections" ? activeTabClasses : inactiveTabClasses)}>Manage Connections</a>
      </li>
    </ul>
  );
}