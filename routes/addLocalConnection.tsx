import { Handlers, PageProps } from "$fresh/server.ts";
import { ulid } from "$std/ulid/mod.ts";
import { BUTTON, CONNECTIONS_KEY_PREFIX } from "../consts.ts";
import { CancelAddConnectionButton } from "../islands/connections/CancelAddConnectionButton.tsx";
import { LocalConnectionRadioButton } from "../islands/connections/LocalConnectionRadio.tsx";
import { KvConnection, KvInstance } from "../types.ts";
import { peekAtLocalKvInstances } from "../utils/autoDiscoverKv.ts";
import { resetLocalConnectionList } from "../utils/connections.ts";
import { localKv } from "../utils/kv/db.ts";
import { readableSize } from "../utils/utils.ts";

interface AllLocalConnectionProps {
  connectionName?: string;
  connectionLocation?: string;
  kvInstances: KvInstance[];
  error: boolean;
  errorText?: string;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const connectionName = formData.get("connectionName");
    const connectionLocation = formData.get("connectionLocation");
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
    } else {
      try {
        //validate file exists
        const fileInfo = await Deno.lstat(connectionLocation);

        //add connection to KV
        const connection: KvConnection = {
          name: connectionName,
          kvLocation: connectionLocation,
          environment: "local",
          id: ulid(),
          isRemote: false,
          size: fileInfo.size,
        };
        await localKv.set([CONNECTIONS_KEY_PREFIX, connection.id], connection);

        await resetLocalConnectionList();

        //forward to connections page
        return new Response("", {
          status: 303,
          headers: { Location: "/" },
        });
      } catch (e) {
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
  async GET(req, ctx) {
    const localKVInstances = await peekAtLocalKvInstances();
    return await ctx.render({ kvInstances: localKVInstances, error: false });
  },
};

export default function AddLocalConnection(props: PageProps<AllLocalConnectionProps>) {
  const localKVInstances = props.data?.kvInstances;
  const isError = props.data?.error;
  const errorText = props.data?.errorText;
  const connectionName = props.data?.connectionName || "";
  const connectionLocation = props.data?.connectionLocation || "";

  return (
    <div class="max-w-full">
      <div class="p-4">
        <div class="mb-3">
          <p class="font-bold text-xl ml-2">Add local KV connection</p>
        </div>
        <div class="bg-white border-1 rounded-xl flex py-3 justify-center pt-3">
          <form method="post">
            {isError && (
              <h2 class="text-lg font-bold p-2 bg-red(400) text-center break-all">
                {errorText || "Invalid connection"}
              </h2>
            )}
            <div class="mt-3">
              <label
                for="connectionName"
                class="inline-block mr-3 w-16 mb-2 text-sm font-medium text-gray-900"
              >
                Name:
              </label>
              <input
                id="connectionName"
                name="connectionName"
                value={connectionName}
                class="rounded bg-blue-100 w-96 p-2"
              />
            </div>
            <div class="mt-5">
              <label
                for="connectionLocation"
                class="inline-block mr-3 w-16 mb-2 text-sm font-medium text-gray-900"
              >
                Location:
              </label>
              <input
                id="connectionLocation"
                name="connectionLocation"
                value={connectionLocation}
                class="rounded bg-blue-100 w-96 p-2"
              />
            </div>
            <div class="flex mt-3 justify-center">
              <button
                class={BUTTON}
                type="submit"
                name="connectionAction"
                value="add"
              >
                Add
              </button>
              <CancelAddConnectionButton />
            </div>
          </form>
        </div>
        <div>
          <p class="my-5 ml-2">
            Below are auto-discovered KV stores with a selection of sample data to help identify
            each KV store. Select one below or manually enter a location above.
          </p>
          <div class="bg-white border-1 rounded-xl pr-5 w-full overflow-auto">
            <table>
              <tbody>
                {localKVInstances.map((kv) => (
                  <tr class="border-b-1 border-red-500 p-2">
                    <td class="text-center w-20 ">
                      <LocalConnectionRadioButton id={kv.kvLocation} />
                    </td>
                    <td class="break-words py-4" id={kv.kvLocation + "_information"}>
                      <p class="font-bold">{kv.kvLocation}</p>
                      <table class="w-full border-1 mt-2">
                        <thead>
                          <tr class="border-b-1">
                            <th>Key</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kv.dataSelection.map((data) => (
                            <tr class="border-b-1">
                              <td class="w-96">{data.key}</td>
                              <td title={data.fullValue}>{data.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                    <td class="w-20 text-center">{readableSize(kv.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
