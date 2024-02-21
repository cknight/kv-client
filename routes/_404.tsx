import { Head } from "$fresh/runtime.ts";
import { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div class="px-4 py-8 mx-auto">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <div>
            <img src="./FOStormtrooper-SS.webp" style="height:200px" />
          </div>
          <h1 class="text-6xl font-bold mt-11">404</h1>
          <div class="flex flex-row mt-16 border rounded p-6">
            <div class="flex flex-col items-center justify-center mx-8">
              <p class="my-4 mt-8 italic">
                "This is not the page you are looking for."
              </p>
              <p class="my-4 italic">"You can go about your business."</p>
              <p class="my-4 italic">"Move along."</p>
            </div>
          </div>

          <a href="/" class="link mt-16">Go back home</a>
        </div>
      </div>
    </>
  );
}
