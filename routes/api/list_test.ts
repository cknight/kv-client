import { assert } from "$std/assert/assert.ts";
import { join } from "$std/path/join.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { logout } from "../../utils/user/logout.ts";
import { localKv } from "../../utils/kv/db.ts";
import { addTestConnection, createFreshCtx, SESSION_ID } from "../../utils/test/testUtils.ts";
import { handler } from "./list.tsx";
import { ListData } from "../list.tsx";

const TEST_DB_PATH = "testDb" + crypto.randomUUID();
const SOURCE = "test_source.db";

Deno.test("list happy path", async () => {
  const kv = await createDb();
  const formData = new FormData();
  formData.append("prefix", "");
  formData.append("start", "");
  formData.append("end", "");
  formData.append("limit", "3");
  formData.append("from", "1");
  formData.append("show", "10");
  formData.append("reverse", "false");
  formData.append("filter", "");
  formData.append("disableCache", "false");
  formData.append("connectionId", "123");

  try {
    const resp = await callAPI(formData);
    assertEquals(resp.status, 200);
    const data = await resp.json() as ListData;

    assertEquals(data.results?.length, 3);
    assertEquals(data.fullResultsCount, 3);
    assert(!data.filtered);
    assert(!data.listComplete);
    assertEquals(data.stats!.isDeploy, false);
    assertEquals(data.stats!.unitsConsumedToday.read, 0);
    assertEquals(data.stats!.unitsConsumedToday.write, 0);
    assertEquals(data.stats!.opStats.cachedResults, 0);
    assertEquals(data.stats!.opStats.kvResults, 3);
    assertEquals(data.stats!.opStats.opType, "read");
    assertEquals(data.stats!.opStats.unitsConsumed, 1);
    assertEquals(data.results![0].key, '["key0"]');
    assertEquals(data.results![0].value, "value0");
    assert(data.results![0].versionstamp !== null);
    assertEquals(data.results![0].valueType, "string");
    assertEquals(data.results![0].fullValue, "value0");
    assert(data.results![0].keyHash.length > 0);
  } finally {
    kv.close();
    await logout(SESSION_ID);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, SOURCE]);
    await Deno.remove(join(Deno.cwd(), TEST_DB_PATH), { recursive: true });
  }
});

Deno.test("List - no connectionId", async () => {
  const formData = new FormData();
  formData.append("prefix", "");
  formData.append("start", "");
  formData.append("end", "");
  formData.append("limit", "3");
  formData.append("from", "1");
  formData.append("show", "10");
  formData.append("reverse", "false");
  formData.append("filter", "");
  formData.append("disableCache", "false");

  const resp = await callAPI(formData);
  assertEquals(resp.status, 400);
  assertEquals(await resp.text(), "No connectionId supplied");
});

async function callAPI(requestData: FormData) {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/api/list", {
    method: "POST",
    body: requestData,
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  return resp;
}

async function createDb(): Promise<Deno.Kv> {
  await Deno.mkdir(TEST_DB_PATH);
  const sourceDbPath = join(Deno.cwd(), TEST_DB_PATH, SOURCE);
  await addTestConnection(sourceDbPath, "123");
  const sourceKv = await Deno.openKv(sourceDbPath);

  for (let i = 0; i < 10; i++) {
    await sourceKv.set([`key${i}`], `value${i}`);
  }

  return sourceKv;
}
