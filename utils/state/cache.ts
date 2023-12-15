import { CachedList, CacheKey, I_CacheManager, ListResults } from "../../types.ts";

export class CacheManager implements I_CacheManager {
  private cache: Map<string, CachedList> = new Map();

  constructor() {
  }

  get(parms: CacheKey): CachedList | undefined {
    const key = this.#key(parms.connectionId, parms.prefix, parms.start, parms.end, parms.reverse);
    const result = this.cache.get(key);
    //FIXME add cache expiration
    return result;
  }

  add(parms: ListResults): void {
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
    console.debug(
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
