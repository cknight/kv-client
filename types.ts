import { Signal } from "@preact/signals";

export interface SearchData {
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

export interface KvSearchOptions {
  kv: Deno.Kv;
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
}

export const CONNECTIONS_KEY_PREFIX = "connections";
export const TW_TABLE_WRAPPER = "inline-block shadow border-1 border-gray-300 rounded-lg overflow-hidden mt-2";
export const TW_TABLE = "table-auto";
export const TW_THEAD = "bg-gray-200";
export const TW_TH = "px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider";
export const TW_TBODY = "mt-3 bg-[#a575a5] divide-y divide-slate-800 dark:divide-[#656565]";
export const TW_TD = "p-2 text-sm font-medium text-gray-200 border-gray-300 border-1";
export const TW_TR = "hover:bg-gray-100 dark:hover:bg-[#656565]";
export const BUTTON = "inline-flex items-center px-4 py-2 mx-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
