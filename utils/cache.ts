import { CachedSearch, I_CacheManager, PartialResults, PartialSearch } from "../types.ts";

export class CacheManager implements I_CacheManager {
  private cache: Map<string, CachedSearch> = new Map();

  constructor() {
  }

  /**
   * @param parms 
   * @returns array of entries if we have exactly what the user requested (or cursor completed), 
   *          the cursor for the next set of entries if we have some or none of what
   *          the user requested or undefined if there is no cache hit
   */
  get(parms: PartialSearch): Deno.KvEntry<unknown>[] | string | undefined {
    const key = this.#key(parms.prefix, parms.start, parms.end, parms.reverse);
    const cachedSearch = this.cache.get(key);
    if (!cachedSearch) return;
    const { from, to } = parms;
    const expectedEntries = to - from + 1;
    const cachedData = cachedSearch.dataRetrieved.slice(from - 1, to);
    if (!cachedSearch.cursor) {
      // All data has already been retrieved, so return whatever we have
      return cachedData;
    } else if (cachedData.length === expectedEntries) {
      // We have exactly the data requested, so return it
      return cachedData;
    } else {
      // We don't have all the data, so fetch more using the cursor
      return cachedSearch.cursor;
    }
  }

  set(parms: PartialResults):void {
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
