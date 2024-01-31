import { Handlers, PageProps } from "$fresh/server.ts";
import { ulid } from "$std/ulid/mod.ts";
import { JSX } from "preact/jsx-runtime";
import { CONNECTIONS_KEY_PREFIX } from "../consts.ts";
import { LocalConnectionRadioButton } from "../islands/connections/LocalConnectionRadio.tsx";
import { KvConnection, KvInstance } from "../types.ts";
import { peekAtLocalKvInstances } from "../utils/connections/autoDiscoverKv.ts";
import { localKv } from "../utils/kv/db.ts";
import { readableSize } from "../utils/utils.ts";
import { CancelLocalConnectionButton } from "../islands/connections/CancelLocalConnectionButton.tsx";
import { Help } from "../islands/Help.tsx";

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

        //validate is valid KV store
        const maybeKv = await Deno.openKv(connectionLocation);
        await Array.fromAsync(maybeKv.list({ prefix: [] }, { limit: 1 }));

        //add connection to KV
        const connection: KvConnection = {
          name: connectionName,
          kvLocation: connectionLocation,
          environment: "local",
          id: ulid(),
          infra: "local",
          size: fileInfo.size,
        };
        await localKv.set([CONNECTIONS_KEY_PREFIX, connection.id], connection);

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

  function cancel(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    window.location.href = "/";
  }

  return (
    <div class="max-w-full">
      <div class="p-4">
        <div class="mb-3">
          <p class="font-bold text-xl ml-2">Add local KV connection</p>
        </div>
        <div class="border border-1 border-[#666] bg-[#353535] rounded-md p-4 mt-3 mx-auto">
          <form method="post" f-client-nav={false}>
            {isError && (
              <h2 class="text-lg font-bold p-2 text-red-500 text-center break-all">
                {errorText || "Invalid connection"}
              </h2>
            )}
            <div class="mt-3 flex flex-row items-center">
              <label
                for="connectionName"
                class="inline-block mr-3 w-16 mb-2 text-sm font-medium"
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
                  Set a name for the connection. This will be displayed on the connections page.
                </p>
              </Help>
            </div>
            <div class="mt-5 flex flex-row items-center">
              <label
                for="connectionLocation"
                class="inline-block mr-3 w-16 mb-2 text-sm font-medium"
              >
                Location:
              </label>
              <input
                id="connectionLocation"
                name="connectionLocation"
                value={connectionLocation}
                class="input input-primary w-full p-2"
              />
              <Help dialogId="locationHelp" dialogTitle="Location">
                <div>
                  Enter a full path to a local KV store. These are typically files with a{" "}
                  <code>.sqlite3</code>{" "}
                  extension. Alternatively, select an auto-discovered KV store below which will
                  populate this field.
                </div>
              </Help>
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
        <div>
          <p class="my-5 ml-2">
            Below are auto-discovered KV stores with a selection of sample data to help identify
            each KV store. Select one below or manually enter a location above.
          </p>
          {localKVInstances.map((kv) => (
            <div class="rounded-xl w-full overflow-auto mb-3">
              <table class="table bg-[#353535]">
                <tbody>
                  <tr class="p-2">
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
                    <td class="w-20 text-center text-xl font-bold">{readableSize(kv.size, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
