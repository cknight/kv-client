import { Handlers, RouteContext } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { ImportCriteria } from "../islands/import/importCriteria.tsx";
import { getConnections } from "../utils/connections/connections.ts";
import { join } from "$std/path/join.ts";
import { setAll } from "../utils/kv/kvSet.ts";
import { getUserState } from "../utils/state/state.ts";
import { ExportCriteria } from "../islands/export/export.tsx";

export default async function Export(req: Request, props: RouteContext) {
  const connections = await getConnections(props.state.session as string);
  const connectionId = new URL(req.url).searchParams.get("connectionId") || "";

  return (
    <>
      <form
        id="pageForm"
        method="post"
        enctype="multipart/form-data"
        f-partial="/export"
        class="m-8 mt-0 "
      >
        <Partial name="export">
          <ExportCriteria connections={connections} connectionId={connectionId}/>
        </Partial>
      </form>
    </>
  );
}
