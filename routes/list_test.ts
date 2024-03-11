import { assert } from "$std/assert/assert.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { KvUIEntry } from "../types.ts";
import { createFreshCtx, SESSION_ID } from "../utils/test/testUtils.ts";
import { ListInputData } from "../utils/ui/list/listHelper.ts";
import { _internals, handler } from "./list.tsx";

Deno.test("List - happy path", async () => {
  _internals.getResults = async (inputData: ListInputData, session: string) => {
    assertEquals(inputData.prefix, "'prefix'");
    assertEquals(inputData.start, "'start'");
    assertEquals(inputData.end, "'end'");
    assertEquals(inputData.limit, "20");
    assertEquals(inputData.reverse, true);
    assertEquals(inputData.disableCache, true);
    assertEquals(inputData.show, 20);
    assertEquals(inputData.from, 1);
    assertEquals(inputData.filter, "filter");
    assertEquals(inputData.connectionId, "123");
    assertEquals(session, SESSION_ID);

    const result: KvUIEntry = {
      key: "'result-key'",
      value: "result-value",
      versionstamp: "result-versionstamp",
      valueType: "string",
      fullValue: "result-fullValue",
      keyHash: "result-keyHash",
    };
    return {
      prefix: "'prefix'",
      start: "'start'",
      end: "'end'",
      limit: "'limit'",
      reverse: true,
      disableCache: true,
      show: 20,
      from: 1,
      fullResultsCount: 1,
      filter: "filter",
      filtered: true,
      listComplete: true,
      results: [result],
    };
  };
  const formData = new FormData();
  formData.append("prefix", "'prefix'");
  formData.append("start", "'start'");
  formData.append("end", "'end'");
  formData.append("limit", "20");
  formData.append("reverse", "on");
  formData.append("from", "1");
  formData.append("show", "20");
  formData.append("filter", "filter");
  formData.append("disableCache", "on");

  const resp = await callHandler(formData);
  assertEquals(resp.status, 200);
  const body = await resp.text();
  assert(
    body.includes(
      `<input type="text" id="filter" name="filter" form="pageForm" class="input input-bordered input-primary ml-2 p-2 my-2" value="filter"/>`,
    ),
  );
  assert(
    body.includes(
      `<button type="button" class="btn btn-primary btn-sm mr-3">Delete 1 filtered</button><button type="button" class="btn btn-primary btn-sm">Copy 1 filtered</button>`,
    ),
  );
  assert(body.includes(`<td>'result-key'</td>`));
  assert(body.includes(`<td title="result-fullValue" class="break-all">result-value</td>`));
  assert(body.includes(`<option value="20" selected>20</option>`));
  assert(body.includes(`Showing 1 to 1 of 1 filtered entries`));
});

Deno.test("List - no connectionId", async () => {
  const request = new Request("http://localhost:8080/list?", {
    method: "POST",
    body: new FormData(),
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST!(request, ctx);
  assertEquals(resp.status, 303);
  assertEquals(resp.headers.get("Location"), "/");
});

async function callHandler(requestData: FormData) {
  assert(handler.POST);

  const request = new Request("http://localhost:8080/list?connectionId=123", {
    method: "POST",
    body: requestData,
  });
  const ctx = createFreshCtx(request);
  const resp = await handler.POST(request, ctx);
  return resp;
}
