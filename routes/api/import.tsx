import { Handlers } from "$fresh/server.ts";
import { join } from "$std/path/join.ts";
import { ImportAuditLog, KvListOptions } from "../../types.ts";
import { getKvConnectionDetails } from "../../utils/connections/connections.ts";
import { executorId } from "../../utils/connections/denoDeploy/deployUser.ts";
import { auditAction, auditConnectionName } from "../../utils/kv/kvAudit.ts";
import { establishKvConnection } from "../../utils/kv/kvConnect.ts";
import { listKv } from "../../utils/kv/kvList.ts";
import { setAll } from "../../utils/kv/kvSet.ts";
import { computeSize, readUnitsConsumed } from "../../utils/kv/kvUnitsConsumed.ts";
import { getUserState } from "../../utils/state/state.ts";
import { asPercentString } from "../../utils/ui/display.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const start = Date.now();
    const form = await req.formData();
    const inputFileFormEntry: FormDataEntryValue | null = form.get("importFile");
    const connectionId = form.get("connectionId");
    const importSource = form.get("importSource");
    const abortId = form.get("abortId") as string | undefined;
    const session = ctx.state.session as string;
    const state = getUserState(session);
    let status = 200;
    let body = "";

    if (!connectionId || typeof connectionId !== "string") {
      return new Response("No connectionId provided", { status: 400 });
    }

    //TODO - Support abort

    try {
      if (inputFileFormEntry && inputFileFormEntry instanceof File) {
        console.debug("  writing import file to disk");
        const tempDir = await Deno.makeTempDir();
        const fullPathFile = join(tempDir, inputFileFormEntry.name);
        try {
          // Step 1: Take the uploaded file and write it to disk
          await Deno.writeFile(
            fullPathFile,
            new Uint8Array(await inputFileFormEntry.arrayBuffer()),
          );
          console.debug("  import file successfully written to disk at " + fullPathFile);

          // Step 2: Open KV connection to file and validate
          const importFromKv = await Deno.openKv(fullPathFile);
          await importFromKv.get(["a random key to test the connection"]);

          // Step 3: Read all entries and write to KV
          console.debug("  KV connection opened and validated");
          const entries = await Array.fromAsync(importFromKv.list({ prefix: [] }));
          const session = ctx.state.session as string;
          const setResult = await setAll(entries, state.kv!, connectionId);

          let opSize = 0;
          for (const entry of entries) {
            opSize += computeSize(entry.key, entry.value);
          }
          const conn = await getKvConnectionDetails(connectionId);
          const auditRecord: ImportAuditLog = {
            auditType: "import",
            executorId: await executorId(session),
            connection: auditConnectionName(conn!),
            infra: conn!.infra,
            rtms: Date.now() - start,
            importSource: "File: " + inputFileFormEntry.name,
            importInfra: "file",
            keysImported: entries.length,
            keysFailed: setResult.failedKeys.length,
            aborted: setResult.aborted,
            writeUnitsConsumed: setResult.writeUnitsConsumed,
            readUnitsConsumed: readUnitsConsumed(opSize),
          };
          await auditAction(auditRecord);

          if (setResult.aborted) {
            status = 499;
            const percComplete = asPercentString(setResult.setKeyCount / entries.length);
            body =
              `Import aborted.  ${setResult.setKeyCount} out of ${entries.length} keys imported (${percComplete} complete).`;
          } else {
            body = setResult.setKeyCount > 0
              ? `All ${setResult.setKeyCount} keys successfully imported`
              : "No keys imported";
          }
        } catch (e) {
          console.log(e);
          return new Response(e.message, { status: 500 });
        } finally {
          // Step 4: Delete file from disk
          await Deno.remove(tempDir, { recursive: true });
        }
      } else if (importSource && typeof importSource === "string") {
        console.debug("  importing from URL");

        const listOptions: KvListOptions = {
          session,
          connectionId: importSource,
          prefix: "",
          start: "",
          end: "",
          limit: "all",
          reverse: false,
          disableCache: false,
          disableAudit: true,
          abortId,
        };
        const listResults = await listKv(listOptions);

        console.debug("  data retrieved from secondary KV connection (import source)");

        const conn = await getKvConnectionDetails(connectionId);
        const sourceConn = await getKvConnectionDetails(importSource);

        if (listResults.aborted) {
          const auditRecord: ImportAuditLog = {
            auditType: "import",
            executorId: await executorId(session),
            connection: auditConnectionName(conn!),
            infra: conn!.infra,
            rtms: Date.now() - start,
            importSource: auditConnectionName(sourceConn!),
            importInfra: sourceConn!.infra,
            keysImported: 0,
            keysFailed: 0,
            aborted: true,
            writeUnitsConsumed: 0,
            readUnitsConsumed: listResults.opStats.unitsConsumed,
          };
          await auditAction(auditRecord);
          status = 499;
          body = "Import aborted.  No keys were imported.";
        } else {
          // Now get a KV connection to the primary/destination kv store
          const kv = await establishKvConnection(session, connectionId);

          const setResult = await setAll(listResults.results, kv, abortId!);
          console.debug("  all entries imported to primary KV connection");

          const auditRecord: ImportAuditLog = {
            auditType: "import",
            executorId: await executorId(session),
            connection: auditConnectionName(conn!),
            infra: conn!.infra,
            rtms: Date.now() - start,
            importSource: auditConnectionName(sourceConn!),
            importInfra: sourceConn!.infra,
            keysImported: setResult.setKeyCount,
            keysFailed: setResult.failedKeys.length,
            aborted: setResult.aborted,
            writeUnitsConsumed: setResult.writeUnitsConsumed,
            readUnitsConsumed: listResults.opStats.unitsConsumed,
          };
          await auditAction(auditRecord);

          if (setResult.aborted) {
            status = 499;
            const percComplete = asPercentString(
              setResult.setKeyCount / listResults.results.length,
            );
            body =
              `Import aborted.  ${setResult.setKeyCount} out of ${listResults.results.length} keys imported (${percComplete} complete).`;
          } else {
            body = setResult.setKeyCount > 0
              ? `All ${setResult.setKeyCount} keys successfully imported`
              : "No keys imported";
          }
        }
      }
    } catch (e) {
      console.log(e);
      body = e.message;
      status = 500;
    }

    console.debug("  import complete", body);
    return new Response(body, {
      status,
    });
  },
};
