import { Stats } from "../types.ts";

export function StatsBar({ stats }: { stats: Stats }) {
  const totalResults = stats.opStats.opType === "read"
    ? stats.opStats.kvResults! + stats.opStats.cachedResults!
    : stats.opStats.kvResults!;

  function unitType(s: Stats) {
    if (s.opStats.opType === "read") {
      return "read";
    }
    return "write";
  }

  function opOutcome(s: Stats) {
    if (s.opStats.opType === "read") {
      //FIXME - need flag if 0 results is from cache or not
      const results = `${totalResults} result${s.opStats.kvResults === 1 ? "" : "s"}`;
      const cache = totalResults === 0
        ? ""
        : ` (${
          totalResults === s.opStats.cachedResults ? "all" : s.opStats.cachedResults
        } from cache)`;
      return results + cache;
    } else if (s.opStats.opType === "delete") {
      return `Deleted ${s.opStats.kvResults} key${s.opStats.kvResults === 1 ? "" : "s"}`;
    } else if (s.opStats.opType === "set") {
      return `Set ${s.opStats.kvResults} key${s.opStats.kvResults === 1 ? "" : "s"}`;
    }
  }

  return (
    <div class="text-sm mt-3">
      {stats.isDeploy
        ? (
          <div class="flex justify-between">
            <div>{opOutcome(stats)} in {stats.opStats.rtms}ms.</div>
            <div>
              Operation cost: {stats.opStats.unitsConsumed} {unitType(stats)} units.{" "}
              {stats.unitsConsumedToday.read} read units, {stats.unitsConsumedToday.write}{" "}
              write units consumed today across {stats.unitsConsumedToday.operations}{" "}
              operation{stats.unitsConsumedToday.operations === 1 ? "" : "s"}.
            </div>
          </div>
        )
        : (
          <div>
            {opOutcome(stats)} in {stats.opStats.rtms}ms
          </div>
        )}
    </div>
  );
}
