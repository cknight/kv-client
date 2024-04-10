import { assertEquals } from "@std/assert/assert-equals";
import { SESSION_ID } from "../test/testUtils.ts";
import { CacheManager } from "./cache.ts";

Deno.test("CacheManager", () => {
  const cacheManager = new CacheManager();
  assertEquals(cacheManager.size(), 0);

  //Add one result to cache
  addToCache(cacheManager, "testPrefix", 0);
  assertEquals(cacheManager.size(), 1);
  assertCacheResults(cacheManager, "testPrefix", 1);

  //Add another result to same key cache
  addToCache(cacheManager, "testPrefix", 1);
  // size() below refers to the number of keys in the cache, not the number of cached results
  assertEquals(cacheManager.size(), 1);
  assertCacheResults(cacheManager, "testPrefix", 2);

  //Add result to different key cache
  addToCache(cacheManager, "anotherPrefix", 0);
  assertEquals(cacheManager.size(), 2);
  assertCacheResults(cacheManager, "anotherPrefix", 1);

  //Set cache, will overwrite existing cache
  cacheManager.set({
    connectionId: "testConnectionId",
    prefix: "testPrefix",
    start: "testStart",
    end: "testEnd",
    reverse: false,
    cursor: "testCursor",
    results: [{
      key: ["testKey-999"],
      value: "testValue-999",
      versionstamp: "testVersionstamp-999",
    }],
  });
  assertEquals(cacheManager.size(), 2);
  const result = cacheManager.get({
    connectionId: "testConnectionId",
    prefix: "testPrefix",
    start: "testStart",
    end: "testEnd",
    reverse: false,
  });
  assertEquals(result?.cursor, "testCursor");
  assertEquals(result?.dataRetrieved.length, 1);
  assertEquals(result?.dataRetrieved[0].key, ["testKey-999"]);
  assertEquals(result?.dataRetrieved[0].value, "testValue-999");

  cacheManager.clear();
  assertEquals(cacheManager.size(), 0);
});

function addToCache(cacheManager: CacheManager, prefix: string, index: number) {
  cacheManager.add({
    connectionId: "testConnectionId",
    prefix,
    start: "testStart",
    end: "testEnd",
    reverse: false,
    cursor: "testCursor",
    results: [{
      key: ["testKey" + index],
      value: "testValue" + index,
      versionstamp: "testVersionstamp" + index,
    }],
  }, SESSION_ID);
}

function assertCacheResults(cacheManager: CacheManager, prefix: string, expectedLength: number) {
  const result = cacheManager.get({
    connectionId: "testConnectionId",
    prefix,
    start: "testStart",
    end: "testEnd",
    reverse: false,
  });
  assertEquals(result?.cursor, "testCursor");
  assertEquals(result?.dataRetrieved.length, expectedLength);
  for (let i = 0; i < expectedLength; i++) {
    assertEquals(result?.dataRetrieved[i].key, ["testKey" + i]);
    assertEquals(result?.dataRetrieved[i].value, "testValue" + i);
  }
}
