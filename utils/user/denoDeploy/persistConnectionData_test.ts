import { assertEquals } from "https://deno.land/std@0.211.0/assert/assert_equals.ts";
import { CONNECTIONS_KEY_PREFIX } from "../../../consts.ts";
import { Environment, KvConnection } from "../../../types.ts";
import { localKv } from "../../kv/db.ts";
import { persistConnectionData } from "./persistConnectionData.ts";

const HIGH_CHICKEN_79_DB_ID = "cc9a9caf-602a-4904-a1a0-1238a456331d";
const IMPORTANT_GOAT_32_DB_ID = "12345678-1f3c-4213-b97b-7fb20f5ab2ae";
const PROUD_CAMEL_62_DB_ID = "e1234567-3b86-4ab8-8a14-e41a27c123d4";

Deno.test("persistConnectionData", async () => {
  try {
    const deployUser = JSON.parse(
      await Deno.readTextFile("./testData/expected_deploy_user.json"),
    );
    await persistConnectionData(deployUser);

    await assertDbConnection(HIGH_CHICKEN_79_DB_ID, "high-chicken-79", "Deploy playground", 232750);
    await assertDbConnection(IMPORTANT_GOAT_32_DB_ID, "important-goat-32", "Deploy preview", 0);
    await assertDbConnection(PROUD_CAMEL_62_DB_ID, "proud-camel-62", "Deploy playground", 0);
  } finally {
    await localKv.delete([CONNECTIONS_KEY_PREFIX, HIGH_CHICKEN_79_DB_ID]);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, IMPORTANT_GOAT_32_DB_ID]);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, PROUD_CAMEL_62_DB_ID]);
  }
});

async function assertDbConnection(dbId: string, name: string, env: Environment, size: number) {
  const conn = await localKv.get<KvConnection>([CONNECTIONS_KEY_PREFIX, dbId]);
  assertEquals(conn.value, {
    id: dbId,
    name: name,
    infra: "Deploy",
    kvLocation: `https://api.deno.com/databases/${dbId}/connect`,
    environment: env,
    size
  });
}
