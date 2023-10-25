Deno.env.set("DENO_KV_ACCESS_TOKEN", "");
const kv = await Deno.openKv(
  "https://api.deno.com/databases/e0183936-3b86-4ee8-8a14-e02a27c925d4/connect",
);
await kv.set(["onjara"], "test");
