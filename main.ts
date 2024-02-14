/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import { env } from "./consts.ts";
import { registerQueueListener } from "./utils/kv/kvQueue.ts";

// Disable debug logging
const log_level = Deno.env.get(env.LOG_LEVEL);
if (log_level !== "DEBUG") {
  console.debug = () => {};
}

const isRunningInDeploy = Deno.env.get("DENO_REGION");
if (isRunningInDeploy) {
  console.error("This application is not suitable for running in Deno Deploy");
  throw new Error("This application is not suitable for running in Deno Deploy");
}

registerQueueListener();

await start(manifest, config);
