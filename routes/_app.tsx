import { PageProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";

export default function App({ Component }: PageProps) {
  return (
    <html data-theme="kvclient" class="h-screen">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>KV Client</title>
        {/* <link
          href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.min.css"
          rel="stylesheet"
          type="text/css"
        /> */}
        <link rel="stylesheet" href="/styles.css" />
        {
          <style>{`
          ::backdrop {
            backdrop-filter: blur(1px);
            background: rgba(0,0,0,0.2);
          }`}
        </style>
        }
      </head>
      <body class="h-full py-4" f-client-nav>
        <Partial name="body">
          <Component />
        </Partial>
      </body>
    </html>
  );
}
