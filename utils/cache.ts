import {
  CachedSearch,
  CacheKey,
  I_CacheManager,
  SearchResults,
} from "../types.ts";

export class CacheManager implements I_CacheManager {
  private cache: Map<string, CachedSearch> = new Map();

  constructor() {
  }

  get(parms: CacheKey): CachedSearch | undefined {
    const key = this.#key(parms.prefix, parms.start, parms.end, parms.reverse);
    return this.cache.get(key);
  }

  add(parms: SearchResults): void {
    const key = this.#key(parms.prefix, parms.start, parms.end, parms.reverse);
    const cachedSearch = this.cache.get(key) || {
      cursor: parms.cursor,
      dataRetrieved: [],
      cacheTime: Date.now(),
    };
    cachedSearch.dataRetrieved.push(...parms.results);
    cachedSearch.cursor = parms.cursor;
    this.cache.set(key, cachedSearch);
  }

  #key(prefix: string, start: string, end: string, reverse: boolean) {
    return `${prefix}.${start}.${end}.${reverse}`;
  }
}
