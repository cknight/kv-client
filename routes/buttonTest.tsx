import { BUTTON } from "../consts.ts";

export default function ButtonTest() {
  return (
    <div class="">
      <button class={BUTTON}>Button</button>
      <button class="inline-flex 
      items-center
      px-4 py-2 mx-2
      border border-transparent
      rounded-md
      shadow-sm
      text-sm
      font-medium
      text-white
      bg-yellow-600 hover:bg-yellow-700
      focus:outline-none
      focus:ring-2
      focus:ring-offset-2
      focus:ring-purple-500">
        Button
      </button>
    </div>
  );
}
