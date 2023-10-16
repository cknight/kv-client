export interface SearchData {
  prefix: string;
  start: string;
  end: string;
  pat?: string;
  patRequired: boolean;
  limit: string;
  reverse: boolean;
  show: number;
  from: number;
  results?: Deno.KvEntry<unknown>[];
  searchComplete: boolean;
  validationError?: string;
}

export interface I_CacheManager {
  get(parms: CacheKey): CachedSearch | undefined;
  add(parms: SearchResults): void;
}

export interface State {
  kv: Deno.Kv | null;
  connection: string | null;
  accessToken?: string;

  cache: I_CacheManager;
}

export interface CachedSearch {
  cursor: string | false;
  dataRetrieved: Deno.KvEntry<unknown>[];
  cacheTime: number;
}

export interface CacheKey {
  prefix: string;
  start: string;
  end: string;
  reverse: boolean;
}

export interface SearchResults extends CacheKey {
  results: Deno.KvEntry<unknown>[];
  cursor: string | false;
}

export interface PartialSearchResults {
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
  connection: string;
  pat: string;
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
}
