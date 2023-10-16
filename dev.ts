#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import "$std/dotenv/load.ts";

// Disable debug logging
const log_level = Deno.env.get("LOG_LEVEL");
if (false && log_level !== "DEBUG") {
  console.debug = () => {};
}

//FIXME - temporarily disable console.error for preact logging bug
const origConsoleError = console.error;
console.error = (msg) => {
  if (typeof msg === "string" && msg.includes("Improper nesting of table")) return;
  origConsoleError(msg);
};

await dev(import.meta.url, "./main.ts", config);
