import { DEPLOY_USER_KEY_PREFIX, ENCRYPTED_USER_ACCESS_TOKEN_PREFIX } from "../../../consts.ts";
import { localKv } from "../../kv/db.ts";
import { getUserState } from "../../state/state.ts";

export async function logout(session: string) {
  const state = getUserState(session);
  state.kv?.close();
  state.kv = null;
  state.connection = null;
  state.deployUserData = null;
  state.cache.clear();

  await localKv.delete([DEPLOY_USER_KEY_PREFIX, session]);
  await localKv.delete([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, session]);
}
