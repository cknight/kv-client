import { JSX } from "preact";

export function KvKeyInput(props: JSX.HTMLAttributes<HTMLInputElement>) {
  return (
    <div class="flex items-center w-full my-2">
      <span class="ml-2 mx-2">{`[`}</span>
      <input {...props} />
      <span class="ml-2 my-2">{`]`}</span>
    </div>
  );
}
