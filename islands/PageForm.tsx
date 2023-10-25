import { Signal } from "@preact/signals";
import { ComponentChildren } from "preact";

interface SearchFormProps {
  children: ComponentChildren;
}

export function SearchForm(props: SearchFormProps) {
  return (
    <form
      id="pageForm"
      xxxf-partial="/partials/results/search?hello=world"
      method="post"
      class="w-full m-8 border-1 border-gray-400 rounded p-5 bg-white"
    >
      {props.children}
    </form>
  );
}
