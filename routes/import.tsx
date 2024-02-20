import { Partial } from "$fresh/runtime.ts";
import { Handlers, RouteContext } from "$fresh/server.ts";
import { join } from "$std/path/join.ts";
import { ImportCriteria } from "../islands/import/importCriteria.tsx";
import { getConnections } from "../utils/connections/connections.ts";
import { setAll } from "../utils/kv/kvSet.ts";
import { getUserState } from "../utils/state/state.ts";

interface ImportProps {
  error?: string;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const inputFileFormEntry: FormDataEntryValue | null = form.get("importFile");
    const connectionId = new URL(req.url).searchParams.get("connectionId") || "";
    if (inputFileFormEntry && inputFileFormEntry instanceof File) {
      console.debug("  writing import file to disk");
      const tempDir = await Deno.makeTempDir();
      const fullPathFile = join(tempDir, inputFileFormEntry.name);
      try {
        // Step 1: Take the uploaded file and write it to disk
        await Deno.writeFile(fullPathFile, new Uint8Array(await inputFileFormEntry.arrayBuffer()));
        console.debug("  import file successfully written to disk");

        // Step 2: Open KV connection to file and validate
        const importFromKv = await Deno.openKv(fullPathFile);
        await importFromKv.get(["a random key to test the connection"]);

        // Step 3: Read all entries and write to KV
        console.debug("  KV connection opened and validated");
        const entries = await Array.fromAsync(importFromKv.list({ prefix: [] }));
        const session = ctx.state.session as string;
        const state = getUserState(session);
        await setAll(entries, state.kv!, connectionId);
        console.debug("  all entries written to KV");
      } catch (e) {
        console.log(e);
        return ctx.render({ error: e.message });
      } finally {
        // Step 4: Delete file from disk
        await Deno.remove(tempDir, { recursive: true });
      }
    }
    return await ctx.render();
  },
};

export default async function Import(req: Request, props: RouteContext<ImportProps>) {
  const connections = await getConnections(props.state.session as string);
  const connectionId = new URL(req.url).searchParams.get("connectionId") || "";

  return (
    <>
      <form
        id="pageForm"
        method="post"
        enctype="multipart/form-data"
        f-partial="/import"
        class="m-8 mt-0 "
      >
        <Partial name="import">
          <ImportCriteria
            error={props.data?.error}
            connections={connections}
            connectionId={connectionId}
          />
        </Partial>
      </form>
    </>
  );
}
