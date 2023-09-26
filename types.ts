import { Signal } from "@preact/signals";

export interface SearchData {
  kvUrl: string;
  pat: string;
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
  results?: KvEntry[];
  validationError?: string;
}

export interface State {
  kvUrl: string;
  pat: string;
  kv: Deno.Kv | null;
  activeTab: Signal<string>;
}

export interface KvEntry {
  key: string;
  value: string;
  versionstamp: string;
  fullValue?: string;
}

export interface KvInstance {
  kvLocation: string;
  dataSelection: KvEntry[];
}

export interface KvConnection {
  kvLocation: string;
  name: string;
  id: string;
}

export const CONNECTIONS_KEY_PREFIX = "connections";

export const TW_TABLE = "table-auto";
export const TW_THEAD = "bg-gray-200";
export const TW_TH = "px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider";
export const TW_TBODY = "mt-3 bg-[#f5f5f5] dark:bg-[#454545] divide-y divide-slate-800 dark:divide-[#656565]";
export const TW_TD = "px-5 py-4 text-sm font-medium text-gray-800 dark:text-white";
export const TW_TR = "hover:bg-gray-100 dark:hover:bg-[#656565]";
