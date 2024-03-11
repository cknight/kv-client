import { ListData } from "../../../routes/list.tsx";
import { KvListOptions, PartialListResults, Stats } from "../../../types.ts";
import { listKv } from "../../kv/kvList.ts";
import { unitsConsumedToday } from "../../kv/kvUnitsConsumed.ts";
import { getUserState } from "../../state/state.ts";
import { createKvUIEntry } from "../../utils.ts";
import { buildResultsPage } from "./buildResultsPage.ts";

export interface ListInputData {
  prefix: string;
  start: string;
  end: string;
  limit: string;
  reverse: boolean;
  from: number;
  show: number;
  filter: string | undefined;
  disableCache: boolean;
  connectionId: string;
}

export async function getResults(
  listInputData: ListInputData,
  session: string,
): Promise<ListData> {
  let failReason;
  let results: Deno.KvEntry<unknown>[] = [];
  let listComplete = false;
  let stats: Stats | undefined;
  try {
    const searchOptions:KvListOptions = {
      session,
      connectionId: listInputData.connectionId,
      prefix: listInputData.prefix,
      start: listInputData.start,
      end: listInputData.end,
      limit: listInputData.limit,
      reverse: listInputData.reverse,
      disableCache: listInputData.disableCache,
    };
    const partialResults = await listKv(searchOptions);
    results = partialResults.results;
    listComplete = partialResults.cursor === false;

    stats = await getStats(session, partialResults);
  } catch (e) {
    if (e instanceof TypeError) {
      failReason = "Issue authorizing with remote connection.  Please sign out and reconnect. " +
        e.message;
      console.error(e);
    } else {
      failReason = e.message || "Unknown error occurred";
      console.error(e);
    }
  }

  const { resultsPage, resultsCount, filtered } = buildResultsPage(
    listInputData.filter,
    results,
    listInputData.from,
    listInputData.show,
    session,
  );
  const resultsToShow = await Promise.all(resultsPage.map(async (e) => await createKvUIEntry(e)));

  const searchData: ListData = {
    ...listInputData,
    results: resultsToShow,
    fullResultsCount: resultsCount,
    filtered,
    listComplete,
    validationError: failReason,
    stats,
  };
  return searchData;
}

async function getStats(session: string, partialResults: PartialListResults): Promise<Stats> {
  const unitsConsumed = await unitsConsumedToday(session);
  return {
    unitsConsumedToday: unitsConsumed,
    opStats: partialResults.opStats,
    isDeploy: getUserState(session)?.connection?.infra === "Deploy" || false,
  };
}
