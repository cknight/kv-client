import { walk } from "$std/fs/walk.ts";
import { join } from "$std/path/mod.ts";
import cache_dir from "https://deno.land/x/dir@1.5.1/home_dir/mod.ts";

const denoDir = Deno.env.get("DENO_DIR");
const cacheDir = denoDir || join(cache_dir() || "", ".cache", "deno");
const locationDir = join(cacheDir, "location_data"); 

try {
  console.log(locationDir);
  if (!Deno.statSync(locationDir).isDirectory) {
    throw new Error("location_data dir not found");
  }
} catch (e) {
  throw new Error("location_data dir not found");
}

for await (const walkEntry of walk(locationDir)) {
  const type = walkEntry.isSymlink
    ? "symlink"
    : walkEntry.isFile
    ? "file"
    : "directory";

  if (type === "file" && walkEntry.name === "kv.sqlite3") {
    const kv = await Deno.openKv(walkEntry.path);
    const output = [];
    let i=0;
    for await (const entry of kv.list({prefix: []})) {
      const val = typeof entry.value === 'string' ? entry.value.slice(0,100) : JSON.stringify(entry.value).slice(0,100);
      output.push([entry.key, val]);
      if (++i > 3) break;
    }
    if (output.length > 1) {
      console.log("--------------------")
      console.log(walkEntry.path);
      console.table(output);
    }
  }
}