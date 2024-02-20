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
        role="tab"
        class={"mr-1 " + (props.tab === "get" ? "tab tab-active" : "tab hover:bg-[#454545]")}
      >
        Get
      </a>
      <a
        href={`list?connectionId=${props.connectionId}`}
        id="list"
        role="tab"
        class={"mr-1 " + (props.tab === "list" ? "tab tab-active" : "tab hover:bg-[#454545]")}
      >
        List
      </a>
      <a
        href={`set?connectionId=${props.connectionId}`}
        id="set"
        role="tab"
        class={"mr-1 " + (props.tab === "set" ? "tab tab-active" : "tab hover:bg-[#454545]")}
      >
        Set
      </a>
      <a
        href={`import?connectionId=${props.connectionId}`}
        id="import"
        role="tab"
        class={"mr-1 " + (props.tab === "import" ? "tab tab-active" : "tab hover:bg-[#454545]")}
      >
        Import
      </a>
      <a
        href={`export?connectionId=${props.connectionId}`}
        id="export"
        role="tab"
        class={"mr-1 " + (props.tab === "export" ? "tab tab-active" : "tab hover:bg-[#454545]")}
      >
        Export
      </a>
    </div>
  );
}
