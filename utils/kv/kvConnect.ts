import { CONNECTIONS_KEY_PREFIX } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { getUserState } from "../state.ts";
import { PATError, ValidationError } from "../errors.ts";
import { localKv } from "./db.ts";

export async function establishKvConnection(session: string, connectionId: string, pat?: string) {
  const state = getUserState(session);

  if (!state) {
    throw new ValidationError("Invalid session");
  } else if (state.connection?.id === connectionId && state.kv) {
    console.debug(`Reusing connection to '${connectionId}'`);
    return;
  } else if (state.connection?.id !== connectionId && state.kv) {
    console.debug(`Closing connection to '${state.connection?.id}'`);
    state!.kv.close();
    state.kv = null;
  }

  const conn = await localKv.get<KvConnection>([
    CONNECTIONS_KEY_PREFIX,
    connectionId,
  ]);
  const location = conn.value?.kvLocation || "<unknown>";

  if (location.startsWith("http")) {
    // Remote KV access
    if (!pat) {
      console.error(
        "Access token required for remote KV access",
      );
      throw new PATError(
        "Access token required for remote KV access",
        "missing",
      );
    } else if (pat.length < 20) {
      console.error("Invalid Access Token supplied");
      throw new PATError(
        "Invalid Personal Access Token (PAT).  If necessary, visit https://dash.deno.com/account#access-tokens to create a new PAT",
        "invalid",
      );
    }
    Deno.env.set("DENO_KV_ACCESS_TOKEN", pat);
    state.kv = await Deno.openKv(location);
    state.accessToken = pat;
    state.connection = conn.value;
  } else {
    // Local KV file
    try {
      // Check if the file exists (and if it does we assume it is a valid KV file)
      await Deno.lstat(location);
    } catch (_e) {
      console.error(`Connection ${location} does not exist`);
      throw new ValidationError(`Please choose a connection`);
    }
    state.kv = await Deno.openKv(location);
    state.connection = conn.value;
  }

  console.debug(`Established KV connection to ${location}`);
}
