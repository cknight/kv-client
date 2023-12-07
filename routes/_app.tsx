import { AppProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";

export default function App({ Component }: AppProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>KV Client</title>
        <link
          href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <link rel="stylesheet" href="/styles.css" />
        {
          /* <style>{`
          ::backdrop {
            background: rgba(0,0,0,0.5);
          }`}
        </style> */
        }
      </head>
      <body class="min-h-screen" f-client-nav>
        <Partial name="body">
          <Component />
        </Partial>
      </body>
    </html>
  );
}
