import { Handlers, PageProps } from "$fresh/server.ts";
import { ulid } from "$std/ulid/mod.ts";
import { JSX } from "preact/jsx-runtime";
import { CONNECTIONS_KEY_PREFIX, ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX, env } from "../consts.ts";
import { LocalConnectionRadioButton } from "../islands/connections/LocalConnectionRadio.tsx";
import { KvConnection, KvInstance } from "../types.ts";
import { peekAtLocalKvInstances } from "../utils/connections/autoDiscoverKv.ts";
import { localKv } from "../utils/kv/db.ts";
import { CancelLocalConnectionButton } from "../islands/connections/CancelLocalConnectionButton.tsx";
import { Help } from "../islands/Help.tsx";
import { SelfHostedAccessTokenInput } from "../islands/SelfHostedAccessTokenInput.tsx";
import { mutex } from "../utils/kv/kvConnect.ts";
import { hashKvKey } from "../utils/utils.ts";
import { storeEncryptedString } from "../utils/transform/encryption.ts";
import { shortHash } from "../utils/utils.ts";

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
    } else {
      try {
        /**
         * Prevent access token leakage in a multi-user setting by acquiring a mutex,
         * establishing the connection, and then clearing the access token from the
         * environment variable.  Access token is only required for the initial
         * connection.
         */
        const release = await mutex.acquire();
        Deno.env.set(env.DENO_KV_ACCESS_TOKEN, accessToken);
        console.log("Connecting to self-hosted KV instance", connectionLocation);
        // test the connection opens successfully
        const tempKv = await Deno.openKv(connectionLocation);
        Deno.env.delete(env.DENO_KV_ACCESS_TOKEN);
        tempKv.close();
        release();

        const hashedLocation = await shortHash(connectionLocation);

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
        storeEncryptedString([ENCRYPTED_SELF_HOSTED_TOKEN_PREFIX, connection.id], accessToken);

        //forward to connections page
        return new Response("", {
          status: 303,
          headers: { Location: "/" },
        });
      } catch (e) {
        console.log(e);
        error = true;
        errorText = e.message.split(":")[0];
      }
    }
    const localKVInstances = await peekAtLocalKvInstances();

    return await ctx.render({
      error,
      errorText,
      kvInstances: localKVInstances,
      connectionName,
      connectionLocation,
    });
  },
};

export default function AddLocalConnection(props: PageProps<AllLocalConnectionProps>) {
  const isError = props.data?.error;
  const errorText = props.data?.errorText;
  const connectionName = props.data?.connectionName || "";
  const connectionLocation = props.data?.connectionLocation || "";

  return (
    <div class="max-w-full">
      <div class="p-4">
        <div class="mb-3">
          <p class="font-bold text-xl ml-2">Add Self-hosted KV connection</p>
        </div>
        <div class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3 mx-auto">
          <form method="post" f-client-nav={false}>
            {isError && (
              <h2 class="text-lg font-bold p-2 text-red-400 text-center break-all">
                {errorText || "Invalid connection"}
              </h2>
            )}
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
    </div>
  );
}
