import { Partial } from "$fresh/runtime.ts";
import { RouteContext } from "$fresh/server.ts";
import { ImportCriteria } from "../islands/import/importCriteria.tsx";
import { getConnections } from "../utils/connections/connections.ts";

interface ImportProps {
  error?: string;
}

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
