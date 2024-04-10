import { assertEquals } from "@std/assert";
import { assertGreaterOrEqual } from "@std/assert";
import { _internals } from "../../kv/kvQueue.ts";
import { cleanup, createDb, DB_ID, SESSION_ID } from "../../test/testUtils.ts";
import { getResults, ListInputData } from "./listHelper.ts";

Deno.test("getResults", async () => {
  const kv = await createDb();
  _internals.enqueue = async (_msg: unknown, _delay: number) => {};
  try {
    for (let i = 0; i < 100; i++) {
      await kv.set(["prefix", i], "testValue-" + i);
    }
    const listInputData: ListInputData = {
      prefix: "`prefix`",
      start: "",
      end: "",
      reverse: false,
      limit: "50",
      from: 3,
      show: 10,
      filter: "1",
      disableCache: false,
      connectionId: DB_ID,
    };

    const results = await getResults(listInputData, SESSION_ID);
    assertEquals(results.prefix, "`prefix`");
    assertEquals(results.start, "");
    assertEquals(results.end, "");
    assertEquals(results.limit, "50");
    assertEquals(results.reverse, false);
    assertEquals(results.disableCache, false);
    assertEquals(results.show, 10);
    assertEquals(results.from, 3);
    /*
     * Get 50 results. Filter for key or value containing '1'. Return 10 results starting from 3rd result.
     * 15 results are filtered. 10 results are returned.
     * 15 results are 1,10,11,12,13,14,15,16,17,18,19,21,31,41
     */
    assertEquals(results.results!.length, 10);
    assertEquals(results.results![0].key, `["prefix", 11]`);
    assertEquals(results.results![0].value, "testValue-11");
    assertEquals(results.results![9].key, `["prefix", 21]`);
    assertEquals(results.results![9].value, "testValue-21");
    assertEquals(results.fullResultsCount, 14); //e.g. num of filtered results from the 50
    assertEquals(results.filter, "1");
    assertEquals(results.filtered, true);
    assertEquals(results.listComplete, false);
    assertEquals(results.validationError, undefined);
    assertEquals(results.stats?.isDeploy, false);
    assertEquals(results.stats?.opStats.cachedResults, 0);
    assertEquals(results.stats?.opStats.kvResults, 50);
    assertEquals(results.stats?.opStats.opType, "read");
    assertGreaterOrEqual(results.stats?.opStats.rtms, 0);
    assertGreaterOrEqual(results.stats?.opStats.unitsConsumed, 1);
    assertGreaterOrEqual(results.stats?.unitsConsumedToday.read, 0);
  } finally {
    await cleanup(kv);
  }
});
