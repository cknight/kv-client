import { walk } from "$std/fs/walk.ts";
import { join } from "$std/path/mod.ts";
import cache_dir from "https://deno.land/x/dir@1.5.1/home_dir/mod.ts";
import { KvInstance, KvUIEntry } from "../types.ts";
import { createKvUIEntry } from "./utils.ts";

const MAX_ROWS = 6; //should be even number
const CACHE_DIR = ".cache";
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
  const denoDir = Deno.env.get("DENO_DIR");
  const cacheDir = denoDir ||
    join(cache_dir() || "", CACHE_DIR, DENO_CACHE_DIR);
  const locationDir = join(cacheDir, LOCATION_DATA_DIR);

  try {
    console.debug(
      "Attempting to auto-discover KV instances cached at " + locationDir,
    );
    if (!Deno.statSync(locationDir).isDirectory) {
      console.error(locationDir + " does not exist or is not a directory");
      return [];
    }
  } catch (e) {
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
        seen.add(JSON.stringify(entry.key));
        output.push(createKvUIEntry(entry));
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
        if (!seen.has(JSON.stringify(entry.key))) {
          output.push(createKvUIEntry(entry));
        }
        if (++i >= MAX_ROWS / 2) break;
      }

      if (output.length > 0) {
        instances.push({
          kvLocation: walkEntry.path,
          dataSelection: output,
        });
      }
      kv.close();
    }
  }
  console.debug(
    `Auto-discovered ${instances.length} KV instances in ${
      Date.now() - start
    }ms`,
  );
  return instances;
}
