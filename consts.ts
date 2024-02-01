// KV key prefixes
export const CONNECTIONS_KEY_PREFIX = "connections";
export const DEPLOY_USER_KEY_PREFIX = "deploy-user";
export const ENCRYPTED_USER_ACCESS_TOKEN_PREFIX = "encrypted-user-access-token";
export const ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX = "encrypted-self-hosted-access-token";
export const DEPLOY_RATE_LIMITER_PREFIX = "deploy-rate-limiter";

export const LINK = "text-[#0000ee] visited:text-violet-700 underline";

// Environment variables
export const env = {
  KV_CLIENT_ENCRYPTION_KEY: "KV_CLIENT_ENCRYPTION_KEY",
  LOG_LEVEL: "KV_CLIENT_LOG_LEVEL",
  DENO_DIR: "DENO_DIR",
  DENO_KV_ACCESS_TOKEN: "DENO_KV_ACCESS_TOKEN",
};

// Regular expressions
export const UINT8_REGEX =
  /^\[((?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)(?:,(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d))*)?]?$/;

// Type helpers
export const simpleTypes = [
  "bigint",
  "boolean",
  "null",
  "number",
  "string",
  "Date",
  "KvU64",
  "RegExp",
  "Uint8Array",
];

// Other constants
export const _24_HOURS_IN_MS = 1000 * 60 * 60 * 24;
