import { Handlers, PageProps } from "$fresh/server.ts";
import { useSignal } from "@preact/signals";
import { CONNECTIONS_KEY_PREFIX, ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX } from "../consts.ts";
import { Help } from "../islands/Help.tsx";
import { SelfHostedAccessTokenInput } from "../islands/SelfHostedAccessTokenInput.tsx";
import { Toast } from "../islands/Toast.tsx";
import { CancelLocalConnectionButton } from "../islands/connections/CancelLocalConnectionButton.tsx";
import { KvConnection, ToastType } from "../types.ts";
import { getSelfHostedConnections } from "../utils/connections/connections.ts";
import { localKv } from "../utils/kv/db.ts";
import { connectToSecondaryKv, openKvWithToken } from "../utils/kv/kvConnect.ts";
import { storeEncryptedString } from "../utils/transform/encryption.ts";
import { shortHash } from "../utils/utils.ts";
import { logError } from "../utils/log.ts";

interface AllLocalConnectionProps {
  connectionName?: string;
  connectionLocation?: string;
  error?: boolean;
  errorText?: string;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const connectionName = formData.get("connectionName");
    const connectionLocation = formData.get("connectionLocation");
    const accessToken = formData.get("accessToken");
    const session = ctx.state.session as string;
    let error = false;
    let errorText: string | undefined;

    if (
      !connectionName || typeof connectionName !== "string"
    ) {
      error = true;
      errorText = "Enter a connection name";
    } else if (!connectionLocation || typeof connectionLocation !== "string") {
      error = true;
      errorText = "Enter a connection location";
    } else if (!accessToken || typeof accessToken !== "string") {
      error = true;
      errorText = "Enter an access token";
    } else if (
      !connectionLocation.startsWith("http://") && !connectionLocation.startsWith("https://")
    ) {
      error = true;
      errorText = "Connection location must be URL starting with http:// or https://";
    } else if (
      (await getSelfHostedConnections(session)).find((conn) => conn.name === connectionName)
    ) {
      error = true;
      errorText = "A connection with this name already exists";
    } else {
      try {
        const hashedLocation = await shortHash(connectionLocation);
        await storeEncryptedString([ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX, hashedLocation], accessToken);
      
        // Check connection opens. (NOTE: If the URL is invalid, any operation will hang indefinitely)
        // See https://github.com/denoland/deno/issues/22248
        await _internals.validateConnection(connectionLocation, accessToken);

        //add connection to KV
        const connection: KvConnection = {
          name: connectionName,
          kvLocation: connectionLocation,
          environment: "self-hosted",
          id: hashedLocation,
          infra: "self-hosted",
          size: -1,
        };
        await localKv.set([CONNECTIONS_KEY_PREFIX, connection.id], connection);

        //forward to connections page
        return new Response("", {
          status: 303,
          headers: { Location: "/" },
        });
      } catch (e) {
        logError({ sessionId: session }, "Failed to add self hosted connection", e);
        error = true;
        errorText = e.message.split(":")[0];
      }
    }

    return await ctx.render({
      error,
      errorText,
      connectionName,
      connectionLocation,
    });
  },
};

async function validateConnection(connectionLocation: string, accessToken: string) {
  const tempKv = await openKvWithToken(connectionLocation, accessToken);
  tempKv.close();
}

export const _internals = {
  validateConnection,
};

export default function AddSelfHostedConnection(props: PageProps<AllLocalConnectionProps>) {
  const isError = props.data?.error;
  const errorText = props.data?.errorText;
  const connectionName = props.data?.connectionName || "";
  const connectionLocation = props.data?.connectionLocation || "";
  const showToastSignal = useSignal(isError ? true : false);
  const toastMsg = useSignal(errorText || "");
  const toastType = useSignal<ToastType>("error");

  return (
    <div class="max-w-full">
      <div class="p-4">
        <div class="mb-3">
          <p class="font-bold text-xl ml-2">Add Self-hosted KV connection</p>
        </div>
        <div class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3 mx-auto">
          <form method="post" f-client-nav={false}>
            <div class="mt-3 flex flex-row items-center">
              <label
                for="connectionName"
                class="inline-block mr-3 w-28 mb-2 text-sm font-medium"
              >
                Name:
              </label>
              <input
                id="connectionName"
                name="connectionName"
                value={connectionName}
                required
                class="input input-primary w-full p-2"
              />
              <Help dialogId="nameHelp" dialogTitle="Name">
                <p>
                  Set a name for the connection. This allows for an easy way to reference the KV
                  store.
                </p>
              </Help>
            </div>
            <div class="mt-5 flex flex-row items-center">
              <label
                for="connectionLocation"
                class="inline-block mr-3 w-28 mb-2 text-sm font-medium"
              >
                Location:
              </label>
              <input
                id="connectionLocation"
                name="connectionLocation"
                value={connectionLocation}
                required
                placeholder={"https://my-self-hosted-instance.com/db"}
                class="input input-primary w-full p-2"
              />
              <Help dialogId="locationHelp" dialogTitle="Location">
                <div>
                  Enter a url (including port if necessary) to a self-hosted KV store.
                </div>
              </Help>
            </div>
            <div class="mt-5">
              <SelfHostedAccessTokenInput />
            </div>
            <div class="flex gap-x-3 mt-3 justify-center">
              <CancelLocalConnectionButton />
              <button
                class="btn btn-primary"
                type="submit"
                name="connectionAction"
                value="add"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
      <Toast
        id="addLocalConnectionToast"
        message={toastMsg.value}
        show={showToastSignal}
        type={toastType.value}
      />
    </div>
  );
}
