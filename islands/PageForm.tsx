import { Signal } from "@preact/signals";
import { ComponentChildren } from "preact";

interface SearchFormProps {
  formIds: Signal<string[]>;
  children: ComponentChildren;
}

export function SearchForm(props: SearchFormProps) {
  function isCheckbox(element: HTMLElement): boolean {
    return element.tagName === "INPUT" && (element as HTMLInputElement).type === "checkbox";
  }

  function updateUrl(id: string) {
    const searchParams = new URLSearchParams(window.location.search);
    const element = document.getElementById(id) as HTMLInputElement;

    if (!element) {
      console.error(`Form element with id ${id} not found. Skipping`);
      return;
    }

    let value = "";

    if (isCheckbox(element)) {
      value = element.checked ? "true" : "false";
    } else {
      value = element.value;
    }
    searchParams.set(id, value);
    window.history.pushState({}, "", `?${searchParams.toString()}`);
  }

  function preSubmit() {
    props.formIds.value.forEach(updateUrl);
  }

  return (
      <form id="pageForm" xxxf-partial="/partials/results/search?hello=world" method="post" onSubmit={preSubmit} class="w-full m-8 border-1 border-gray-400 rounded p-5 bg-white">
        {props.children}
      </form>
    );
}