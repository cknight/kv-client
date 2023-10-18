import { LINK } from "../consts.ts";
import { KvKeyInput } from "./KvKeyInput.tsx";

export function KeyHelp(props: { keyPart: string}) {
  return (
    <>
      <div>This is the {props.keyPart} key to search for and is equivalent to the {props.keyPart} option in the 
        {" "}<a href="https://docs.deno.com/kv/manual/operations#list" target="_blank" class={LINK}>Deno.Kv.prototype.list</a>{" "} 
        operation.  It takes the form of a series of 
        {" "}<a href="https://deno.land/api?s=Deno.KvKeyPart&unstable=" target="_blank" class={LINK}>Deno.KvKeyParts</a>.
        Enter the key parts as if you were coding them in Typescript/Javascript, as comma separated values. 
        The outer brackets of the key are provided for you.  To enter various types of key parts, use the following syntax:
      </div>
      <div class="flex justify-center my-3">
        <table class="border-1">
          <thead>
            <tr class="border-1">
              <th class="border-1 p-3">Type</th>
              <th class="border-1 p-3">Example values</th>
              <th class="border-1 p-3">Resulting Deno.KvKey</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-1">
              <td class="border-1 p-3">string</td>
              <td class="border-1 p-3">"example1", 'example2', `example3`</td>
              <td class="border-1 p-3">kv.list(&#123;{props.keyPart}: ["example1", "example2", "example3"]&#125;)</td>
            </tr>
            <tr class="border-1">
              <td class="border-1 p-3">number</td>
              <td class="border-1 p-3">1, -1, 0</td>
              <td class="border-1 p-3">kv.list(&#123;{props.keyPart}: [1, -1, 0]&#125;)</td>
            </tr>
            <tr class="border-1">
              <td class="border-1 p-3">boolean</td>
              <td class="border-1 p-3">true, false</td>
              <td class="border-1 p-3">kv.list(&#123;{props.keyPart}: [true, false]&#125;)</td>
            </tr>
            <tr class="border-1">
              <td class="border-1 p-3">Uint8Array</td>
              <td class="border-1 p-3">[1, 2, 3]</td>
              <td class="border-1 p-3">kv.list(&#123;{props.keyPart}: [new Uint8Array([1,2,3])]&#125;)</td>
            </tr>
            <tr class="border-1">
              <td class="border-1 p-3">BigInt</td>
              <td class="border-1 p-3">18014398509481982n</td>
              <td class="border-1 p-3">kv.list(&#123;{props.keyPart}: [18014398509481982n]&#125;)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>You can also combine different types in a single key.  For example, here is a Deno.KvKey made up 
        of 5 parts:  string, number, boolean Uint8Array and BigInt:</div>
      <KvKeyInput
              type="text"
              readOnly={true}
              class="rounded bg-blue-100 w-full p-2"
              value={`"example1", 1, true, [200,2,87], 18014398509481982n`}
            />
    </>
  );
}