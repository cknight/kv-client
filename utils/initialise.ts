import { env } from "../consts.ts";
import { registerQueueListener } from "./kv/kvQueue.ts";
import { initializeLogging } from "./log.ts";

// Setup logging
initializeLogging();

// Error out if running in Deno Deploy
const isRunningInDeploy = Deno.env.get("DENO_REGION");
if (isRunningInDeploy) {
  console.error("This application is not suitable for running in Deno Deploy");
  throw new Error("This application is not suitable for running in Deno Deploy");
}
registerQueueListener();

// Warn if no encryption key is available in the environment
const encryptionKey = Deno.env.get(env.KV_CLIENT_ENCRYPTION_KEY);
if (!encryptionKey) {
  console.warn("");
  console.warn("");
  console.warn("*************************************");
  console.warn(
    "%c⚠️ WARNING: No encryption key supplied in " + env.KV_CLIENT_ENCRYPTION_KEY +
      " environment variable.  Access tokens will be lost on process restart.  See https://kv-client.dev/docs/security/access-tokens#token-encryption for more info.",
    "color: yellow",
  );
  console.warn("*************************************");
  console.warn("");
  console.warn("");
}
