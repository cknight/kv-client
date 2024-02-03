import { LINK } from "../consts.ts";
import { KvKeyInput } from "../islands/keyValue/KvKeyInput.tsx";

export function BasicKeyHelp() {
  return (
    <>
      <div>
        This is the key of the Deno KV Entry. It takes the form of a series of{" "}
        <a href="https://deno.land/api?s=Deno.KvKeyPart&unstable=" target="_blank" class={LINK}>
          Deno.KvKeyParts
        </a>. Enter the key parts as if you were coding them in Typescript/Javascript, as comma
        separated values. The outer brackets of the key are provided for you. To enter various types
        of key parts, use the following syntax:
      </div>
      <div class="flex justify-center my-3">
        <table class="table table-sm border border-[#151515]">
          <thead>
            <tr>
              <th class="text-[#d5d5d5] text-sm bg-gray-700 shaodw-lg">Type</th>
              <th class="text-[#d5d5d5] text-sm bg-gray-700 shaodw-lg">Example values</th>
              <th class="text-[#d5d5d5] text-sm bg-gray-700 shaodw-lg">Resulting Deno.KvKey</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>string</td>
              <td>"example1", 'example2', `example3`</td>
              <td>
                ["example1", "example2", "example3"]
              </td>
            </tr>
            <tr>
              <td>number</td>
              <td>1, -1, 0</td>
              <td>[1, -1, 0]</td>
            </tr>
            <tr>
              <td>boolean</td>
              <td>true, false</td>
              <td>[true, false]</td>
            </tr>
            <tr>
              <td>Uint8Array</td>
              <td>[1, 2, 3]</td>
              <td>
                [new Uint8Array([1,2,3])]
              </td>
            </tr>
            <tr>
              <td>bigint</td>
              <td>18014398509481982n</td>
              <td>
                [18014398509481982n]
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        You can also combine different types in a single key. For example, here is a Deno.KvKey made
        up of 5 parts: string, number, boolean Uint8Array and bigint:
      </div>
      <KvKeyInput
        type="text"
        readOnly={true}
        disableTypes={true}
        class="input input-bordered input-primary w-full p-2"
        value={`"example1", 1, true, [200,2,87], 18014398509481982n`}
      />
    </>
  );
}
