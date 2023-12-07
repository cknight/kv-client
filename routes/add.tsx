import { Handlers, PageProps } from "$fresh/server.ts";
import { Fragment } from "preact";
import { AddEntryEditor } from "../islands/AddEntryEditor.tsx";

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const key = form.get("key")?.toString() || "";
    const value = form.get("value")?.toString() || "";
    const valueType = form.get("valueType")?.toString() || "";
    const doNotOverwrite = form.get("doNotOverwrite")?.toString() === "on";

    return await ctx.render();
  },
};

export default function Add(props: PageProps<unknown>) {
  return (
    <Fragment>
      <form
        id="pageForm"
        method="post"
        class="w-full h-full m-8 mt-0 border-1 border-gray-400 rounded p-5 bg-white"
      >
        <div class="flex flex-col w-full h-full">
          <AddEntryEditor />
        </div>
      </form>
    </Fragment>
  );
}
