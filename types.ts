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
  filter: string | undefined;
  searchComplete: boolean;
  validationError?: string;
}

export interface I_CacheManager {
  get(parms: CacheKey): CachedSearch | undefined;
  add(parms: SearchResults): void;
}

export interface State {
  kv: Deno.Kv | null;
  connection: KvConnection | null;
  connectionIsDeploy: boolean;
  accessToken?: string;

  cache: I_CacheManager;
}

export interface CachedSearch {
  cursor: string | false;
  dataRetrieved: Deno.KvEntry<unknown>[];
  cacheTime: number;
}

export interface CacheKey {
  connection: string;
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
  opStats: OpStats;
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

export type AuditLog = {
  executorId: string;
  connection: string;
  isDeploy: boolean;
  rtms: number;  //Round trip milliseconds
};

export type ListAuditLog = AuditLog & {
  auditType: "list";
  prefixKey: string;
  startKey: string;
  endKey: string;
  limit: string;
  reverse: boolean;
  results: number;
  readUnitsConsumed: number;
};

export type DeleteAuditLog = AuditLog & {
  auditType: "delete";
  keysDeleted: number;
  writeUnitsConsumed: number;
};

export type UnitsConsumed = {
  operations: number;
  read: number;
  write: number;
};

export type OpStats = {
  unitType: "read" | "write";
  unitsConsumed: number;
  cachedResults?: number;
  kvResults?: number;
  rtms: number;
}