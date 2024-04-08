import { env } from "../consts.ts";
import { userNames } from "./state/state.ts";

type LOG_LEVELS = "DEBUG" | "INFO" | "WARN" | "ERROR";
let configuredLogLevels: LOG_LEVELS[] = [];

export function initializeLogging() {
  const LOG_LEVEL = Deno.env.get(env.LOG_LEVEL) || "INFO";

  const allowedLogLevels: LOG_LEVELS[] = ["DEBUG", "INFO", "WARN", "ERROR"];

  if (!allowedLogLevels.includes(LOG_LEVEL as LOG_LEVELS)) {
    throw new Error(
      `Invalid LOG_LEVEL: ${LOG_LEVEL}. Allowed values are: ${allowedLogLevels.join(", ")}`,
    );
  }

  configuredLogLevels = allowedLogLevels.slice(
    allowedLogLevels.indexOf(LOG_LEVEL as LOG_LEVELS),
  );
}

export function logDebug(session: { sessionId: string | null }, ...args: unknown[]) {
  if (configuredLogLevels.includes("DEBUG")) {
    console.debug("[DEBUG]", dateTime(), getPrefix(session), ...args);
  }
}

export function logInfo(session: { sessionId: string | null }, ...args: unknown[]) {
  if (configuredLogLevels.includes("INFO")) {
    console.info("[INFO ]", dateTime(), getPrefix(session), ...args);
  }
}

export function logWarn(session: { sessionId: string | null }, ...args: unknown[]) {
  if (configuredLogLevels.includes("WARN")) {
    console.warn("[WARN ]", dateTime(), getPrefix(session), ...args);
  }
}

export function logError(session: { sessionId: string | null }, ...args: unknown[]) {
  if (configuredLogLevels.includes("ERROR")) {
    console.error("[ERROR]", dateTime(), getPrefix(session), ...args);
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

function dateTime(): string {
  return new Date().toISOString();
}
