interface TabBarProps {
  tab: string;
  connectionId: string;
}

export function TabBar(props: TabBarProps) {
  const activeTabClasses = "border-b-4 border-blue-700 text-blue-600";
  const inactiveTabClasses = "text-gray-600";
  const tabBase = "tab inline-block hover:text-blue-600 py-2 px-4 text-lg font-medium text-center ";

  return (
    <ul class="w-full mt-2 flex justify-center flex-wrap border-b border-gray-200">
      <li class="mr-2" aria-current={props.tab === "search" ? "page" : "false"}>
        <a
          href={`search?connectionId=${props.connectionId}`}
          id="search"
          class={tabBase + (props.tab === "search" ? activeTabClasses : inactiveTabClasses)}
        >
          Search
        </a>
      </li>
      <li class="mr-2" aria-current={props.tab === "Add" ? "page" : "false"}>
        <a
          href={`add?connectionId=${props.connectionId}`}
          id="add"
          class={tabBase + (props.tab === "add" ? activeTabClasses : inactiveTabClasses)}
        >
          Add
        </a>
      </li>
      {
        /* <li class="mr-2" aria-current={props.tab === "importExport" ? "page" : "false"}>
        <a
          href={`importExport?connectionId=${props.connectionId}`}
          id="importExport"
          class={tabBase + (props.tab === "importExport" ? activeTabClasses : inactiveTabClasses)}
        >
          Set
        </a>
      </li> */
      }
    </ul>
  );
}
