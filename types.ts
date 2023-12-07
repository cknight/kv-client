import { DeployUser } from "./utils/connections/denoDeploy/deployUser.ts";

export interface SearchData {
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
  disableCache: boolean;
  show: number;
  from: number;
  results?: KvUIEntry[];
  fullResultsCount: number;
  filter: string | undefined;
  filtered: boolean;
  searchComplete: boolean;
  validationError?: string;
  stats?: Stats;
}

export interface I_CacheManager {
  get(parms: CacheKey): CachedSearch | undefined;
  add(parms: SearchResults): void;
  set(parms: SearchResults): void;
  clear(): void;
}

export interface State {
  kv: Deno.Kv | null;
  connection: KvConnection | null;
  deployUserData: DeployUser | null;
  cache: I_CacheManager;
}

export interface CachedSearch {
  cursor: string | false;
  dataRetrieved: Deno.KvEntry<unknown>[];
  cacheTime: number;
}

export interface CacheKey {
  connectionId: string;
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
  keyHash: string;
}

export interface KvInstance {
  kvLocation: string;
  dataSelection: KvUIEntry[];
  size: number;
}

export type Environment = "local" | "prod" | "preview" | "playground" | "other";

export interface KvConnection {
  kvLocation: string;
  environment: Environment;
  name: string;
  organisation?: string;
  id: string;
  isRemote: boolean;
  size: number;
}

export interface KvSearchOptions {
  session: string;
  connectionId: string;
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
  disableCache: boolean;
}

export type AuditLog<T extends "list" | "delete" | "copy" | "update" | "add"> = {
  auditType: T;
  executorId: string;
  connection: string;
  isDeploy: boolean;
  rtms: number; //Round trip milliseconds
};

export type ListAuditLog = AuditLog<"list"> & {
  prefixKey: string;
  startKey: string;
  endKey: string;
  limit: string;
  reverse: boolean;
  results: number;
  readUnitsConsumed: number;
};

export type DeleteAuditLog = AuditLog<"delete"> & {
  keysDeleted: number;
  keysFailed: number;
  aborted: boolean;
  writeUnitsConsumed: number;
};

export type CopyAuditLog = AuditLog<"copy"> & {
  destinationConnection: string;
  isDestinationDeploy: boolean;
  keysCopied: number;
  keysFailed: number;
  aborted: boolean;
  writeUnitsConsumed: number;
};

export type UpdateAuditLog = AuditLog<"update"> & {
  updateSuccessful: boolean;
  writeUnitsConsumed: number;
  key: string;
  originalValue: string;
  newValue: string;
};

export type AddAuditLog = AuditLog<"add"> & {
  addSuccessful: boolean;
  writeUnitsConsumed: number;
  key: string;
  value: string;
};

export type AuditRecord =
  | ListAuditLog
  | DeleteAuditLog
  | CopyAuditLog
  | UpdateAuditLog
  | AddAuditLog;

export type UnitsConsumed = {
  operations: number;
  read: number;
  write: number;
};

export type OpStats = {
  opType: "read" | "delete" | "set";
  unitsConsumed: number;
  cachedResults?: number;
  kvResults?: number;
  rtms: number;
};

export type Stats = {
  unitsConsumedToday: UnitsConsumed;
  opStats: OpStats;
  isDeploy: boolean;
};

export type CopyDeleteProps = {
  keysSelected: string[];
  connections?: { name: string; id: string; env: string }[];
  connectionLocation: string;
  connectionId: string;
  prefix: string;
  start: string;
  end: string;
  from: number;
  show: number;
  resultsCount: number;
  reverse: boolean;
  filter?: string;
};

export type ToastType = "info" | "warn" | "error";
export type SupportedValueTypes =
  | "bigint"
  | "boolean"
  | "null"
  | "number"
  | "string"
  | "Array"
  | "Date"
  | "JSON"
  | "KvU64"
  | "Map"
  | "Object"
  | "RegExp"
  | "Set"
  | "Uint8Array";
