import { CachedSearch, CacheKey, I_CacheManager, SearchResults } from "../../types.ts";

export class CacheManager implements I_CacheManager {
  private cache: Map<string, CachedSearch> = new Map();

  constructor() {
  }

  get(parms: CacheKey): CachedSearch | undefined {
    const key = this.#key(parms.connectionId, parms.prefix, parms.start, parms.end, parms.reverse);
    const result = this.cache.get(key);
    //FIXME add cache expiration
    return result;
  }

  add(parms: SearchResults): void {
    const key = this.#key(parms.connectionId, parms.prefix, parms.start, parms.end, parms.reverse);
    const cachedSearch = this.cache.get(key);

    if (!cachedSearch) {
      this.cache.set(key, {
        cursor: parms.cursor,
        dataRetrieved: parms.results,
        cacheTime: Date.now(),
      });
    } else {
      cachedSearch.cursor = parms.cursor;
      cachedSearch.dataRetrieved = cachedSearch.dataRetrieved.concat(parms.results);
      cachedSearch.cacheTime = Date.now();
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

  set(parms: SearchResults): void {
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
