import { Handlers, PageProps } from "$fresh/server.ts";
import { Fragment } from "preact";
import { SetEntryEditor } from "../islands/SetEntryEditor.tsx";

export default function Set(props: PageProps<unknown>) {
  return (
    <Fragment>
      <div class="m-8 mt-0">
        <div class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3">
          <SetEntryEditor />
        </div>
      </div>
    </Fragment>
  );
}
