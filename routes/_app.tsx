import { AppProps } from "$fresh/server.ts";

export default function App({ Component }: AppProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>kv-explorer</title>
      </head>
      <body class="min-h-screen bg-[#f3f3f3]">
        <Component />
      </body>
    </html>
  );
}
