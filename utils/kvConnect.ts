import { CONNECTIONS_KEY_PREFIX, KvConnection } from "../types.ts";
import { getState } from "./state.ts";
import { ValidationError } from "./validationError.ts";

export async function establishKvConnection(session:string, connection: string, pat?: string) {
  const kvLocal = await Deno.openKv();
  const conn = await kvLocal.get<KvConnection>([
    CONNECTIONS_KEY_PREFIX,
    connection,
  ]);
  const location = conn.value?.kvLocation || "<unknown>";
  const state = getState(session);
  
  if (location.startsWith("http")) {
    // Remote KV access
    if (!pat || pat.length < 20) {
      console.error("Invalid Personal Access Token (PAT) supplied");
      throw new ValidationError(
        "Invalid Personal Access Token (PAT).  If necessary, visit https://dash.deno.com/account#access-tokens to create a new PAT",
      );
    }
    pat && Deno.env.set("DENO_KV_ACCESS_TOKEN", pat);
    state!.kv = await Deno.openKv(location);
  } else {
    // Local KV file
    try {
      // Check if the file exists (and if it does we assume it is a valid KV file)
      await Deno.lstat(location);
    } catch (e) {
      console.error(`${location} does not exist`);
      throw new ValidationError(`${location} does not exist`);
    }
    state!.kv = await Deno.openKv(location);
  }

  console.log(`Established KV connection to ${location}`);
}
