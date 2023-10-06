export interface SearchData {
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
  results?: KvUIEntry[];
  validationError?: string;
}

export interface I_CacheManager {
  get(parms: PartialSearch): Deno.KvEntry<unknown>[] | string | undefined;
  set(parms: PartialResults): void;
}

export interface State {
  kv: Deno.Kv | null;

  cache: I_CacheManager;
}

export interface CachedSearch {
  cursor: string | false;
  dataRetrieved: Deno.KvEntry<unknown>[];
  cacheTime: number;
}

export interface PartialSearch {
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
  from: number;
  to: number;
}

export interface PartialResults {
  prefix: string;
  start: string;
  end: string;
  reverse: boolean;
  results: Deno.KvEntry<unknown>[];
  cursor: string | false;
}
export interface KvUIEntry {
  key: string;
  value: string;
  versionstamp: string;
  fullValue?: string;
}

export interface KvInstance {
  kvLocation: string;
  dataSelection: KvUIEntry[];
}

export interface KvConnection {
  kvLocation: string;
  name: string;
  id: string;
}

export interface KvSearchOptions {
  session: string;
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
  cursor?: string;
}

export const CONNECTIONS_KEY_PREFIX = "connections";
export const TW_TABLE_WRAPPER =
  "inline-block shadow border-1 border-gray-300 rounded-lg overflow-hidden mt-2";
export const TW_TABLE = "table-auto";
export const TW_THEAD = "bg-gray-200";
export const TW_TH =
  "px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider";
export const TW_TBODY =
  "mt-3 bg-[#a575a5] divide-y divide-slate-800 dark:divide-[#656565]";
export const TW_TD =
  "p-2 text-sm font-medium text-gray-200 border-gray-300 border-1";
export const TW_TR = "hover:bg-gray-100 dark:hover:bg-[#656565]";
export const BUTTON =
  "inline-flex items-center px-4 py-2 mx-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500";
