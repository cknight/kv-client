import { Partial } from "$fresh/runtime.ts";
import { RouteContext } from "$fresh/server.ts";
import { ExportCriteria } from "../islands/export/export.tsx";
import { getConnections } from "../utils/connections/connections.ts";

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
          <ExportCriteria connections={connections} connectionId={connectionId} />
        </Partial>
      </form>
    </>
  );
}
