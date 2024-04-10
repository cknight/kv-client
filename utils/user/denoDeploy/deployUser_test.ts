import { assertEquals } from "@std/assert/assert-equals";
import { assert } from "@std/assert";
import {
  CONNECTIONS_KEY_PREFIX,
  DEPLOY_RATE_LIMITER_PREFIX,
  DEPLOY_USER_KEY_PREFIX,
  ENCRYPTED_USER_ACCESS_TOKEN_PREFIX,
} from "../../../consts.ts";
import { localKv } from "../../kv/db.ts";
import { SESSION_ID } from "../../test/testUtils.ts";
import {
  buildRemoteData,
  DeployKvInstance,
  DeployProject,
  DeployUser,
  executorId,
  getDeployUserData,
} from "./deployUser.ts";
import { _internals } from "./deployUser.ts";
import { deployKvEnvironment } from "./deployUser.ts";
import { storeEncryptedString } from "../../transform/encryption.ts";
import { Environment, KvConnection } from "../../../types.ts";

const ACCESS_TOKEN = "1234567890abcd";
const HIGH_CHICKEN_79_DB_ID = "cc9a9caf-602a-4904-a1a0-1238a456331d";
const IMPORTANT_GOAT_32_DB_ID = "12345678-1f3c-4213-b97b-7fb20f5ab2ae";
const PROUD_CAMEL_62_DB_ID = "e1234567-3b86-4ab8-8a14-e41a27c123d4";

Deno.test("Deploy user - happy path", async () => {
  setDeployDataExpectations();

  try {
    const deployUser = await buildRemoteData(ACCESS_TOKEN, SESSION_ID);
    const rateLimit = await localKv.get<number>([DEPLOY_RATE_LIMITER_PREFIX, SESSION_ID]);
    assert(rateLimit.value);
    assert(Date.now() - rateLimit.value < 100);
    const expectedJson = JSON.parse(
      await Deno.readTextFile("./testData/expected_deploy_user.json"),
    );
    assertEquals(deployUser, expectedJson);
  } finally {
    await localKv.delete([DEPLOY_RATE_LIMITER_PREFIX, SESSION_ID]);
  }
});

Deno.test("Deploy user - rate limit exceeded", async () => {
  await localKv.set([DEPLOY_RATE_LIMITER_PREFIX, SESSION_ID], Date.now());

  try {
    await buildRemoteData(ACCESS_TOKEN, SESSION_ID);
  } catch (e) {
    assertEquals(e.message, "Rate limit for session exceeded, please try again in one minute");
  } finally {
    await localKv.delete([DEPLOY_RATE_LIMITER_PREFIX, SESSION_ID]);
  }
});

Deno.test("Deploy KV Environment", () => {
  assertEquals(
    deployKvEnvironment(deployProject("playground", "main"), kvInstance("")),
    "Deploy playground",
  );
  assertEquals(
    deployKvEnvironment(deployProject("git", "main"), kvInstance("main")),
    "Deploy prod",
  );
  assertEquals(
    deployKvEnvironment(deployProject("git", "main"), kvInstance("a branch")),
    "Deploy preview",
  );
  assertEquals(
    deployKvEnvironment(deployProject("something else", "main"), kvInstance("a branch")),
    "other",
  );
});

Deno.test("Executor id - with Deploy user", async () => {
  try {
    const deployUser = JSON.parse(await Deno.readTextFile("./testData/expected_deploy_user.json"));
    await localKv.set([DEPLOY_USER_KEY_PREFIX, SESSION_ID], deployUser);
    const executor = await executorId(SESSION_ID);
    assertEquals(executor, "Joe Bloggs (joeBloggs)");
  } finally {
    await localKv.delete([DEPLOY_USER_KEY_PREFIX, SESSION_ID]);
    await localKv.delete([DEPLOY_RATE_LIMITER_PREFIX, SESSION_ID]);
  }
});

Deno.test("Executor id - without Deploy user", async () => {
  const executor = await executorId(SESSION_ID);
  assertEquals(executor, SESSION_ID);
});

Deno.test("getDeployUserData - use in KV cache", async () => {
  try {
    const deployUser = JSON.parse(await Deno.readTextFile("./testData/expected_deploy_user.json"));
    await localKv.set([DEPLOY_USER_KEY_PREFIX, SESSION_ID], deployUser);
    const deployUserFetched = await getDeployUserData(SESSION_ID, true);
    assertEquals(deployUserFetched, deployUser);
  } finally {
    await localKv.delete([DEPLOY_USER_KEY_PREFIX, SESSION_ID]);
    await localKv.delete([DEPLOY_RATE_LIMITER_PREFIX, SESSION_ID]);
  }
});

Deno.test("getDeployUserData - no user in cache, no refresh", async () => {
  assertEquals(await getDeployUserData(SESSION_ID, false), null);
});

Deno.test("getDeployUserData - no user in cache, refresh", async () => {
  setDeployDataExpectations();
  await localKv.delete([DEPLOY_RATE_LIMITER_PREFIX, SESSION_ID]);
  await storeEncryptedString([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, SESSION_ID], ACCESS_TOKEN);
  try {
    const deployUser = JSON.parse(await Deno.readTextFile("./testData/expected_deploy_user.json"));

    assertEquals((await localKv.get([DEPLOY_USER_KEY_PREFIX, SESSION_ID])).value, null);

    const deployUserFetched = await getDeployUserData(SESSION_ID, true);
    assertEquals(deployUserFetched, deployUser);
    const deployUserCached = await localKv.get<DeployUser>([DEPLOY_USER_KEY_PREFIX, SESSION_ID]);
    assertEquals(deployUserCached.value, deployUser);

    await assertDbConnection(HIGH_CHICKEN_79_DB_ID, "high-chicken-79", "Deploy playground", 232750);
    await assertDbConnection(IMPORTANT_GOAT_32_DB_ID, "important-goat-32", "Deploy preview", 0);
    await assertDbConnection(PROUD_CAMEL_62_DB_ID, "proud-camel-62", "Deploy playground", 0);
  } finally {
    await localKv.delete([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, SESSION_ID]);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, HIGH_CHICKEN_79_DB_ID]);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, IMPORTANT_GOAT_32_DB_ID]);
    await localKv.delete([CONNECTIONS_KEY_PREFIX, PROUD_CAMEL_62_DB_ID]);
    await localKv.delete([DEPLOY_USER_KEY_PREFIX, SESSION_ID]);
    await localKv.delete([DEPLOY_RATE_LIMITER_PREFIX, SESSION_ID]);
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
    size,
  });
}

function setDeployDataExpectations() {
  _internals.getRootData = async (accessToken: string) => {
    assertEquals(accessToken, ACCESS_TOKEN);
    return JSON.parse(await Deno.readTextFile("./testData/rootData.json"));
  };

  _internals.getOrganizationDetail = async (orgId: string, accessToken: string) => {
    assertEquals(accessToken, ACCESS_TOKEN);
    if (orgId === "abc92def-1f23-1a2b-b241-999ef0d4b64b") {
      return JSON.parse(await Deno.readTextFile(`./testData/orgs_myorg.json`));
    } else if (orgId === "95f70485-1234-5678-z432-8d2f681c90ac") {
      return JSON.parse(await Deno.readTextFile(`./testData/orgs_user.json`));
    } else {
      throw new Error("Invalid org id");
    }
  };

  _internals.getProjectDbs = async (name: string, accessToken: string) => {
    assertEquals(accessToken, ACCESS_TOKEN);
    if (name === "high-chicken-79" || name === "important-goat-32" || name === "proud-camel-62") {
      const projectResp = JSON.parse(await Deno.readTextFile(`./testData/kv_${name}.json`));
      projectResp.projectName = name;
      return projectResp;
    } else {
      throw new Error("Invalid project name");
    }
  };
}

function deployProject(type: string, productionBranch: string): DeployProject {
  return {
    id: "95f70485-1234-5678-z432-8d2f681c90ac",
    name: "high-chicken-79",
    type,
    productionBranch,
    kvInstances: [],
  };
}

function kvInstance(branch: string): DeployKvInstance {
  return {
    databaseId: "1234567890abcd",
    sizeBytes: 1000000,
    branch,
  };
}
