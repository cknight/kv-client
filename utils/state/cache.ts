import { _24_HOURS_IN_MS } from "../../consts.ts";
import { CachedList, CacheKey, I_CacheManager, ListResults } from "../../types.ts";
import { logDebug } from "../log.ts";

export class CacheManager implements I_CacheManager {
  private cache: Map<string, CachedList> = new Map();

  constructor() {
  }

  size(): number {
    return this.cache.size;
  }

  get(parms: CacheKey): CachedList | undefined {
    const key = this.#key(parms.connectionId, parms.prefix, parms.start, parms.end, parms.reverse);
    const result = this.cache.get(key);
    if (result && (result.cacheTime + _24_HOURS_IN_MS) < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return result;
  }

  add(parms: ListResults, session: string): void {
    const key = this.#key(parms.connectionId, parms.prefix, parms.start, parms.end, parms.reverse);
    const cachedListResults = this.cache.get(key);

    if (!cachedListResults) {
      this.cache.set(key, {
        cursor: parms.cursor,
        dataRetrieved: parms.results,
        cacheTime: Date.now(),
      });
    } else {
      cachedListResults.cursor = parms.cursor;
      cachedListResults.dataRetrieved = cachedListResults.dataRetrieved.concat(parms.results);
      cachedListResults.cacheTime = Date.now();
    }

    const result = this.cache.get(key);
    logDebug(
      { sessionId: session },
      "Cache for key",
      JSON.stringify(key),
      "|| cursor:",
      result?.cursor,
      "items:",
      result?.dataRetrieved.length,
    );
  }

  set(parms: ListResults): void {
    const key = this.#key(parms.connectionId, parms.prefix, parms.start, parms.end, parms.reverse);
    this.cache.set(key, {
      cursor: parms.cursor,
      dataRetrieved: parms.results,
      cacheTime: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  #key(connection: string, prefix: string, start: string, end: string, reverse: boolean) {
    return `${connection}.${prefix}.${start}.${end}.${reverse}`;
  }
}
