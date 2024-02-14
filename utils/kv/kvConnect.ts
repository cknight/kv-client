import {
  CONNECTIONS_KEY_PREFIX,
  ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX,
  ENCRYPTED_USER_ACCESS_TOKEN_PREFIX,
  env,
} from "../../consts.ts";
import { KvConnection } from "../../types.ts";
import { getUserState } from "../state/state.ts";
import { ValidationError } from "../errors.ts";
import { localKv } from "./db.ts";
import { Mutex } from "semaphore/mutex.ts";
import { getEncryptedString } from "../transform/encryption.ts";

export const mutex = new Mutex();

export async function establishKvConnection(
  session: string,
  connectionId: string,
): Promise<Deno.Kv> {
  const userState = getUserState(session);
  if (!userState) {
    // No session found
    throw new ValidationError("Invalid session");
  } else if (userState.connection?.id === connectionId && userState.kv) {
    // Already connected to the requested connection
    console.debug(`Reusing connection to '${userState.connection?.name}'`);
    return userState.kv;
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

  if (connection && connection.infra === "Deploy") {
    // Remote KV access
    const accessToken = await getEncryptedString([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, session]);
    if (!accessToken) {
      throw new ValidationError("No access token available");
    }

    userState.kv = await openKvWithToken(connection.kvLocation, accessToken);
    userState.connection = conn.value;
  } else if (connection && connection.infra === "self-hosted") {
    // Self-hosted KV access
    const accessToken = await getEncryptedString([
      ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX,
      connection.id,
    ]);
    if (!accessToken) {
      throw new ValidationError("No access token available");
    }
    userState.kv = await openKvWithToken(connection.kvLocation, accessToken);
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
  return userState.kv;
}

/**
 * Establish a secondary KV connection.  This is used for copying data between KV instances.
 *
 * @param session
 * @param connectionId
 * @returns Deno.Kv connection (untested)
 */
export async function connectToSecondaryKv(
  session: string,
  connectionId: string,
): Promise<Deno.Kv> {
  const conn = await localKv.get<KvConnection>([
    CONNECTIONS_KEY_PREFIX,
    connectionId,
  ]);
  const connection: KvConnection | null = conn.value;

  if (!connection) {
    console.error(`Connection ${connectionId} does not exist in connections in KV`);
    throw new Error(`Connection ${connectionId} does not exist`);
  }

  const location = connection.kvLocation;
  if (connection.infra === "Deploy") {
    const accessToken = await getEncryptedString([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, session]);
    const kv = await openKvWithToken(location, accessToken);
    return kv;
  } else if (connection.infra === "self-hosted") {
    const accessToken = await getEncryptedString([
      ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX,
      connection.id,
    ]);

    const kv = await openKvWithToken(location, accessToken);
    return kv;
  } else {
    // Local KV file
    try {
      // Check if the file exists (and if it does we assume it is a valid KV file)
      await Deno.lstat(location);
    } catch (_e) {
      console.error(`Connection ${location} does not exist`);
      throw new Error(`Connection ${location} does not exist`);
    }
    return await Deno.openKv(location);
  }
}

/**
 * Prevent access token leakage in a multi-user setting by acquiring a mutex,
 * establishing the connection, and then clearing the access token from the
 * environment variable.  Access token is only required for the initial
 * connection.
 */
export async function openKvWithToken(location: string, token: string | null): Promise<Deno.Kv> {
  if (!token) {
    console.error("No access token available");
    throw new Error("No access token available");
  }

  const release = await mutex.acquire();
  Deno.env.set(env.DENO_KV_ACCESS_TOKEN, token);
  const kv = await Deno.openKv(location);
  Deno.env.delete(env.DENO_KV_ACCESS_TOKEN);
  release();
  return kv;
}
