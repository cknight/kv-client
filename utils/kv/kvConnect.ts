import { CONNECTIONS_KEY_PREFIX, ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, env } from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { getUserState } from "../state/state.ts";
import { ValidationError } from "../errors.ts";
import { localKv } from "./db.ts";
import { Mutex } from "semaphore/mutex.ts";
import { getEncryptedString } from "../transform/encryption.ts";

export const mutex = new Mutex();

export async function establishKvConnection(session: string, connectionId: string): Promise<void> {
  const userState = getUserState(session);

  if (!userState) {
    // No session found
    throw new ValidationError("Invalid session");
  } else if (userState.connection?.id === connectionId && userState.kv) {
    // Already connected to the requested connection
    console.debug(`Reusing connection to '${userState.connection?.name}'`);
    return;
  } else if (userState.connection?.id !== connectionId && userState.kv) {
    // Connected to a different connection, so close it first
    console.debug(`Closing connection to '${userState.connection?.name}'`);
    userState!.kv.close();
    userState.kv = null;
    userState.connection = null;
  }

  // Get connection details for id
  const conn = await localKv.get<KvConnection>([
    CONNECTIONS_KEY_PREFIX,
    connectionId,
  ]);
  const connection: KvConnection | null = conn.value;

  if (connection && connection.isRemote) {
    // Remote KV access
    const accessToken = await getEncryptedString([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, session]);
    if (!accessToken) {
      //FIXME - forward to access token input page
      throw new ValidationError("No access token available");
    }

    /**
     * Prevent access token leakage in a multi-user setting by acquiring a mutex,
     * establishing the connection, and then clearing the access token from the
     * environment variable.  Access token is only required for the initial
     * connection.
     */
    const release = await mutex.acquire();
    Deno.env.set(env.DENO_KV_ACCESS_TOKEN, accessToken);
    userState.kv = await Deno.openKv(connection.kvLocation);
    Deno.env.delete(env.DENO_KV_ACCESS_TOKEN);
    release();

    userState.connection = conn.value;
  } else if (connection) {
    // Local KV file
    const location = connection.kvLocation;
    try {
      // Check if the file exists (and if it does we assume it is a valid KV file)
      await Deno.lstat(location);
    } catch (_e) {
      console.error(`Connection ${location} does not exist`);
      throw new ValidationError(`Connection ${location} does not exist`);
    }
    userState.kv = await Deno.openKv(location);
    userState.connection = conn.value;
  } else {
    throw new ValidationError(`Connection ${connectionId} does not exist`);
  }

  console.debug(`Established KV connection to '${connection.name} (${connection.environment})'`);
}
