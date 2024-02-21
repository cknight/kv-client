import { DEPLOY_USER_KEY_PREFIX, ENCRYPTED_USER_ACCESS_TOKEN_PREFIX } from "../../../consts.ts";
import { localKv } from "../../kv/db.ts";
import { deleteUserState } from "../../state/state.ts";

export async function logout(session: string) {
  deleteUserState(session);
  await localKv.delete([DEPLOY_USER_KEY_PREFIX, session]);
  await localKv.delete([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, session]);
}
