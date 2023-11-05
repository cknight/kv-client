// KV key prefixes
export const CONNECTIONS_KEY_PREFIX = "connections";
export const DEPLOY_USER_KEY_PREFIX = "deploy-user";
export const ENCRYPTED_USER_ACCESS_TOKEN_PREFIX = "encrypted-user-access-token";


// Tailwind CSS classes
export const TW_TABLE_WRAPPER =
  "w-full inline-block shadow border-1 border-gray-300 rounded-lg overflow-hidden mt-2";
export const TW_TABLE = "w-full table-auto";
export const TW_THEAD = "bg-gray-200";
export const TW_TH =
  "px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider";
export const TW_TBODY = "mt-3 bg-[#a575a5] divide-y divide-slate-800";
export const TW_TD = "p-2 text-sm font-medium text-gray-200 border-gray-300 border-1";
export const TW_TR = "hover:bg-gray-100";
export const BUTTON =
  "inline-flex items-center px-4 py-2 mx-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500";
export const LINK = "text([#0000ee] visited:text-violet-700) underline";

// Environment variables
export const env = {
  KV_CLIENT_ENCRYPTION_KEY: "KV_CLIENT_ENCRYPTION_KEY",
  LOG_LEVEL: "LOG_LEVEL",
  DENO_DIR: "DENO_DIR",
  DENO_KV_ACCESS_TOKEN: "DENO_KV_ACCESS_TOKEN",
};