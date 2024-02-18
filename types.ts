export interface I_CacheManager {
  get(parms: CacheKey): CachedList | undefined;
  add(parms: ListResults): void;
  set(parms: ListResults): void;
  clear(): void;
}

export interface State {
  kv: Deno.Kv | null;
  connection: KvConnection | null;
  cache: I_CacheManager;
}

export interface CachedList {
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

export interface ListResults extends CacheKey {
  results: Deno.KvEntry<unknown>[];
  cursor: string | false;
}

export interface PartialListResults {
  results: Deno.KvEntry<unknown>[];
  cursor: string | false;
  opStats: OpStats;
  aborted: boolean;
}

export interface KvUIEntry {
  key: string;
  value: string;
  versionstamp: string;
  valueType: string;
  fullValue: string;
  keyHash: string;
}

export interface KvInstance {
  kvLocation: string;
  dataSelection: KvUIEntry[];
  size: number;
}

export type Environment =
  | "local"
  | "Deploy prod"
  | "Deploy preview"
  | "Deploy playground"
  | "other"
  | "self-hosted";
export type Infra = "local" | "Deploy" | "self-hosted" | "unknown" | "file";

export interface KvConnection {
  kvLocation: string;
  environment: Environment;
  name: string;
  organisation?: string;
  id: string;
  infra: Infra;
  size: number;
}

export interface KvListOptions {
  session: string;
  connectionId: string;
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
  disableCache: boolean;
  disableAudit?: boolean;
  abortId?: string;
}

export interface KvGetOptions {
  session: string;
  connectionId: string;
  key: string;
}

type ExportTypes = "list" | "delete" | "copy" | "update" | "set" | "get" | "import" | "export";
export type AuditLog<T extends ExportTypes> = {
  auditType: T;
  executorId: string;
  connection: string;
  infra: Infra;
  rtms: number; //Round trip milliseconds
};

export type ListAuditLog = AuditLog<"list"> & {
  prefixKey: string;
  startKey: string;
  endKey: string;
  limit: string;
  reverse: boolean;
  results: number;
  aborted: boolean;
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
  destinationInfra: Infra;
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
  newVersionstamp?: string;
};

export type SetAuditLog = AuditLog<"set"> & {
  setSuccessful: boolean;
  writeUnitsConsumed: number;
  key: string;
  value: string;
  versionstamp?: string;
};

export type GetAuditLog = AuditLog<"get"> & {
  key: string;
  resultVersionstamp: string | null;
  readUnitsConsumed: number;
};

export type ImportAuditLog = AuditLog<"import"> & {
  importSource: string;
  importInfra: Infra;
  keysImported: number;
  keysFailed: number;
  aborted: boolean;
  writeUnitsConsumed: number;
  readUnitsConsumed: number;
};

export type ExportAuditLog = AuditLog<"export"> & {
  keysExported: number;
  aborted: boolean;
  bytesRead: number;
  readUnitsConsumed: number;
};

export type AuditRecord =
  | ListAuditLog
  | DeleteAuditLog
  | CopyAuditLog
  | UpdateAuditLog
  | SetAuditLog
  | GetAuditLog
  | ImportAuditLog
  | ExportAuditLog;

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

export type CopyDeleteMultiProps = {
  keysSelected: string[];
  connections?: { name: string; id: string; env: Environment }[];
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

export type CopyDeleteSingleProps = {
  kvKey: string;
  connections?: { name: string; id: string; env: Environment }[];
  connectionLocation: string;
  connectionId: string;
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

export type ExportStatus = {
  status: "initiating" | "in progress" | "complete" | "aborted" | "failed";
  keysProcessed: number;
  bytesProcessed: number;
};

export type QueueDeleteExportFile = {
  channel: "DeleteMessage";
  message: {
    exportId: string;
    tempDirPath: string;
  };
};
