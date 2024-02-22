import { env } from "../consts.ts";
import { userNames } from "./state/state.ts";

type LOG_LEVELS = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LOG_LEVEL = Deno.env.get(env.LOG_LEVEL) || "INFO";

const allowedLogLevels: LOG_LEVELS[] = ["DEBUG", "INFO", "WARN", "ERROR"];

if (!allowedLogLevels.includes(LOG_LEVEL as LOG_LEVELS)) {
  throw new Error(
    `Invalid LOG_LEVEL: ${LOG_LEVEL}. Allowed values are: ${allowedLogLevels.join(", ")}`,
  );
}

const configuredLogLevels = allowedLogLevels.slice(
  allowedLogLevels.indexOf(LOG_LEVEL as LOG_LEVELS),
);

const DEBUG_ENABLED = configuredLogLevels.includes("DEBUG");

export function logDebug(session: { sessionId: string | null }, ...args: unknown[]) {
  if (DEBUG_ENABLED) {
    console.debug(getPrefix(session), ...args);
  }
}

export function logInfo(session: { sessionId: string | null }, ...args: unknown[]) {
  if (configuredLogLevels.includes("INFO")) {
    console.info(getPrefix(session), ...args);
  }
}
function getUserId(sessionId: string | null): string {
  if (!sessionId) {
    return "-";
  }

  return userNames.get(sessionId) || "Anonymous";
}

function getPrefix(session: { sessionId: string | null }) {
  return session.sessionId ? `[${session.sessionId}][${getUserId(session.sessionId)}] ` : "---";
}
