#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";
import "$std/dotenv/load.ts";
import { env } from "./consts.ts";

const log_level = Deno.env.get(env.LOG_LEVEL);

if (log_level !== "DEBUG") {
  // Disable debug logging
  console.debug = () => {};
}

await dev(import.meta.url, "./main.ts", config);
