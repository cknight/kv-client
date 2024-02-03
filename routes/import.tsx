import { Handlers, RouteContext } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { Toast } from "../islands/Toast.tsx";
import { useSignal } from "@preact/signals";
import { ToastType } from "../types.ts";

interface ImportProps {
  error?: string;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    return await ctx.render();
  },
};

export default async function Import(req: Request, props: RouteContext<ImportProps>) {
  const showToastSignal = useSignal(props.data.error ? true : false);
  const toastMsg = useSignal(props.data.error || "");
  const toastType = useSignal<ToastType>("error");

  return (
    <>
      <form
        id="pageForm"
        method="post"
        f-partial="/import"
        class="m-8 mt-0 "
      >
        <Partial name="import">
          <div class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3">
            <div class="flex w-full justify-center gap-x-4 mt-4">
              <button
                type="button"
                onClick={resetForm}
                form="pageForm"
                class="btn btn-secondary w-[72px]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={submitForm}
                form="pageForm"
                class="btn btn-primary w-[72px]"
              >
                Get
              </button>
            </div>
            <Toast
              id="importToast"
              message={toastMsg.value}
              show={showToastSignal}
              type={toastType.value}
            />
          </div>
        </Partial>
      </form>
    </>
  );
}
