#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import "$std/dotenv/load.ts";

// Disable debug logging
const log_level = Deno.env.get("LOG_LEVEL");
if (true || log_level !== "DEBUG") {
  console.debug = () => {};
}

await dev(import.meta.url, "./main.ts", config);
