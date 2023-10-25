interface TabBarProps {
  tab: string;
}

export function TabBar(props: TabBarProps) {
  const activeTabClasses = "border-b-4 border-blue-700 text-blue-600";
  const inactiveTabClasses = "text-gray-600";
  const tabBase = "tab inline-block hover:text-blue-600 py-2 px-4 text-lg font-medium text-center ";

  return (
    <ul class="w-full mt-2 flex justify-center flex-wrap border-b border-gray-500">
      <li class="mr-2" aria-current={props.tab === "search" ? "page" : "false"}>
        <a
          href="search"
          id="search"
          class={tabBase + (props.tab === "search" ? activeTabClasses : inactiveTabClasses)}
        >
          Search
        </a>
      </li>
      <li class="mr-2" aria-current={props.tab === "delete" ? "page" : "false"}>
        <a
          href="delete"
          id="delete"
          class={tabBase + (props.tab === "delete" ? activeTabClasses : inactiveTabClasses)}
        >
          Delete
        </a>
      </li>
      <li class="mr-2" aria-current={props.tab === "insertUpdate" ? "page" : "false"}>
        <a
          href="insertUpdate"
          id="insertUpdate"
          class={tabBase + (props.tab === "insertUpdate" ? activeTabClasses : inactiveTabClasses)}
        >
          Set
        </a>
      </li>
      <li class="mr-2" aria-current={props.tab === "connections" ? "page" : "false"}>
        <a
          href="connections"
          id="connections"
          class={tabBase + (props.tab === "connections" ? activeTabClasses : inactiveTabClasses)}
        >
          Manage Connections
        </a>
      </li>
    </ul>
  );
}
