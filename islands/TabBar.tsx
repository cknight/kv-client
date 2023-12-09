interface TabBarProps {
  tab: string;
  connectionId: string;
}

export function TabBar(props: TabBarProps) {
  return (
    <div role="tablist" class="tabs tabs-boxed mb-2 bg-[#353535]">
      <a
        href={`get?connectionId=${props.connectionId}`}
        id="get"
        class={"mr-1 " + (props.tab === "get" ? "tab tab-active" : "tab hover:bg-[#454545]")}
      >
        Get
      </a>
      <a
        href={`search?connectionId=${props.connectionId}`}
        id="search"
        class={"mr-1 " + (props.tab === "search" ? "tab tab-active" : "tab hover:bg-[#454545]")}
      >
        Search
      </a>
      <a
        href={`add?connectionId=${props.connectionId}`}
        id="add"
        class={"mr-1 " + (props.tab === "add" ? "tab tab-active" : "tab hover:bg-[#454545]")}
      >
        Add
      </a>
      <a
        href={`importExport?connectionId=${props.connectionId}`}
        id="importExport"
        class={props.tab === "importExport" ? "tab tab-active" : "tab hover:bg-[#454545]"}
      >
        Import/Export
      </a>
    </div>
  );
}
