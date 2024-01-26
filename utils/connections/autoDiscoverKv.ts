import { walk } from "$std/fs/walk.ts";
import { join } from "$std/path/mod.ts";
import { KvInstance, KvUIEntry } from "../../types.ts";
import { createKvUIEntry, hashKvKey } from "../utils.ts";
import { env } from "../../consts.ts";

const MAX_ROWS = 6; //should be even number
const DENO_CACHE_DIR = "deno";
const LOCATION_DATA_DIR = "location_data";
const DEFAULT_KV_FILENAME = "kv.sqlite3";

/**
 * Iterates over the location_data directory and returns a list of KV instances
 * including full file path and a selection of data where the instance has at
 * least 1 key/value pair of data.  location_data is either based on DENO_DIR
 * environment variable or the default cache directory for the OS.  Only the
 * default "kv.sqlite3" file is considered.  Custom file names are not supported.
 * Data is retrieved using the list interface to select all data.  The first 3
 * key/value pairs and last 3 key/value pairs are returned.
 *
 * @returns <KvInstance[]> containing the full file path and a partial array of data
 */
export async function peekAtLocalKvInstances(): Promise<KvInstance[]> {
  const start = Date.now();
  const denoDir = Deno.env.get(env.DENO_DIR);
  const fullCacheDir = denoDir || join(cacheDir() || "", DENO_CACHE_DIR);
  const locationDir = join(fullCacheDir, LOCATION_DATA_DIR);

  try {
    console.debug(
      "Attempting to auto-discover KV instances cached at " + locationDir,
    );
    if (!Deno.statSync(locationDir).isDirectory) {
      console.error(locationDir + " does not exist or is not a directory");
      return [];
    }
  } catch (_e) {
    console.error(locationDir + " does not exist or is not a directory");
    return [];
  }

  const instances: KvInstance[] = [];
  for await (const walkEntry of walk(locationDir)) {
    if (walkEntry.isFile && walkEntry.name === DEFAULT_KV_FILENAME) {
      const kv = await Deno.openKv(walkEntry.path);
      const output: KvUIEntry[] = [];
      const seen: Set<string> = new Set();
      let i = 0;

      // Get first set of entries
      for await (
        const entry of kv.list({ prefix: [] }, { limit: MAX_ROWS / 2 })
      ) {
        seen.add(await hashKvKey(entry.key));
        output.push(await createKvUIEntry(entry));
        if (++i >= MAX_ROWS / 2) break;
      }

      i = 0;

      // Get last set of entries
      for await (
        const entry of kv.list({ prefix: [] }, {
          reverse: true,
          limit: MAX_ROWS / 2,
        })
      ) {
        if (!seen.has(await hashKvKey(entry.key))) {
          output.push(await createKvUIEntry(entry));
        }
        if (++i >= MAX_ROWS / 2) break;
      }

      if (output.length > 0) {
        let size = 0;
        try {
          const fileInfo = await Deno.lstat(walkEntry.path);
          size = fileInfo.size;
        } catch (e) {
          console.error(
            "Unable to get size of " + walkEntry.path + ": " + e.message,
          );
        }
        instances.push({
          kvLocation: walkEntry.path,
          dataSelection: output,
          size,
        });
      }
      kv.close();
    }
  }
  console.debug(
    `Auto-discovered ${instances.length} KV instances in ${Date.now() - start}ms`,
  );
  return instances;
}

function cacheDir(): string | undefined {
  if (Deno.build.os === "darwin") {
    const home = homeDir();
    if (home) {
      return join(home, "Library/Caches");
    }
  } else if (Deno.build.os === "windows") {
    return Deno.env.get("LOCALAPPDATA");
  } else {
    const cacheHome = Deno.env.get("XDG_CACHE_HOME");
    if (cacheHome) {
      return cacheHome;
    } else {
      const home = homeDir();
      if (home) {
        return join(home, ".cache");
      }
    }
  }
}

function homeDir(): string | undefined {
  if (Deno.build.os === "windows") {
    Deno.permissions.request({ name: "env", variable: "USERPROFILE" });
    return Deno.env.get("USERPROFILE");
  } else {
    Deno.permissions.request({ name: "env", variable: "HOME" });
    return Deno.env.get("HOME");
  }
}
