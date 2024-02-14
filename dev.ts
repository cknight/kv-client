#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";
import "$std/dotenv/load.ts";
import { env } from "./consts.ts";
import { registerQueueListener } from "./utils/kv/kvQueue.ts";
import { join } from "$std/path/join.ts";

const log_level = Deno.env.get(env.LOG_LEVEL);

if (log_level !== "DEBUG") {
  // Disable debug logging
  console.debug = () => {};
}

const isRunningInDeploy = Deno.env.get("DENO_REGION");
if (isRunningInDeploy) {
  console.error("This application is not suitable for running in Deno Deploy");
  throw new Error("This application is not suitable for running in Deno Deploy");
}
registerQueueListener();

await dev(import.meta.url, "./main.ts", config);
