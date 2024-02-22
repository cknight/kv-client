import { PageProps, RouteConfig } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

export default function Error500Page({ error }: PageProps) {
  return (
    <>
      <Head>
        <title>500 - Internal Server Error</title>
      </Head>
      <div class="px-4 py-8 mx-auto">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <div class="flex flex-row items-center">
            <div>
              <img src="./8.png" style="height:100px" />
            </div>
            <div>
              <p class="italic text-2xl">"Would it help if I got out and pushed?"</p>
            </div>
          </div>
          <p class="mt-12 text-3xl">500 internal error:</p>
          <p class="mt-12 border rounded p-12">{(error as Error).message}</p>
          <a href="/" class="link mt-16">Go back home</a>
        </div>
      </div>
    </>
  );
}
