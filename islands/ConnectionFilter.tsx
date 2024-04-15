import { XIcon } from "../components/svg/XIcon.tsx";

export function ConnectionFilter() {
  function filter() {
    const filter = document.getElementById("connectionFilter")! as HTMLInputElement;
    const filterText = filter.value;
    console.log("Filter text:", filterText);
    const connections = document.querySelectorAll(".connectionCard") as NodeListOf<HTMLDivElement>;
    connections.forEach((connection) => {
      if (filterText === "") {
        connection.style.display = "block";
      } else {
        if (connection.querySelector("h1")?.innerHTML.includes(filterText)) {
          connection.style.display = "block";
        } else {
          connection.style.display = "none";
        }
      }
    });
  }

  function clearFilter() {
    const filter = document.getElementById("connectionFilter")! as HTMLInputElement;
    filter.value = "";
    filter.dispatchEvent(new Event("input"));
  }

  return (
    <div class="relative m-auto">
      <input
        id="connectionFilter"
        type="text"
        onInput={filter}
        class="sm:text-sm input input-primary block w-[300px] p-2.5 pr-10"
        placeholder="Filter"
      />
      <button
        type="button"
        class="absolute inset-y-0 right-0 px-3 py-2.5"
        aria-label="Clear filter"
        onClick={clearFilter}
      >
        <XIcon textColor="text-gray-500" title="Clear filter" />
      </button>
    </div>
  );
}
