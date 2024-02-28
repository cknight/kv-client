import {
  _24_HOURS_IN_MS,
  DEPLOY_RATE_LIMITER_PREFIX,
  DEPLOY_USER_KEY_PREFIX,
  ENCRYPTED_USER_ACCESS_TOKEN_PREFIX,
} from "../../../consts.ts";
import { Environment } from "../../../types.ts";
import { localKv } from "../../kv/db.ts";
import { logDebug } from "../../log.ts";
import { getEncryptedString } from "../../transform/encryption.ts";
import { getOrganizationDetail, getProjectDbs, getRootData } from "./dash.ts";
import { persistConnectionData } from "./persistConnectionData.ts";

const rateLimits: Map<string, number> = new Map();

export interface DeployUser {
  id: string;
  login: string;
  name: string;
  avatarUrl: string;
  organisations: DeployOrg[];
}

export interface DeployOrg {
  id: string;
  name: string | null;
  projects: DeployProject[];
}

export interface DeployProject {
  id: string;
  name: string;
  type: string;
  productionBranch: string | null;
  kvInstances: DeployKvInstance[];
}

export interface DeployKvInstance {
  databaseId: string;
  sizeBytes: number;
  branch: string;
}

export async function buildRemoteData(accessToken: string, session: string): Promise<DeployUser> {
  const lastSessionAccess = await localKv.get<number>([DEPLOY_RATE_LIMITER_PREFIX, session]);

  if (lastSessionAccess.value && Date.now() - lastSessionAccess.value < 30000) {
    throw new Error("Rate limit for session exceeded");
  }
  //Get user details and the orgs they belong to
  const rootData = await getRootData(accessToken);
  const deployUser = {
    id: rootData.user.id,
    login: rootData.user.login,
    name: rootData.user.name,
    avatarUrl: rootData.user.avatarUrl,
    organisations: [] as DeployOrg[],
  };

  //Get the details of the org and the projects within it
  //N.b. a null org is the individual user
  const orgs = rootData.organizations;
  const orgDetails = await Promise.all(
    orgs.map((org) => getOrganizationDetail(org.id, accessToken)),
  );
  orgDetails.forEach((o) => {
    const org = o.organization;
    deployUser.organisations.push({
      id: org.id,
      name: org.name,
      projects: org.projects.map((p) => {
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          productionBranch: p.type === "git" ? p.git?.productionBranch || null : null,
          kvInstances: [] as DeployKvInstance[],
        };
      }),
    });
  });

  //Finally, get the KV details for each project.  A project an have multiple KV instances
  //e.g. production and preview
  const projectNames: string[] = [];
  deployUser.organisations.forEach((o) => {
    o.projects.forEach((p) => {
      projectNames.push(p.name);
    });
  });

  const projectDbs = await Promise.all(
    projectNames.map((name) => getProjectDbs(name, accessToken)),
  );
  deployUser.organisations.forEach((o) => {
    o.projects.forEach((p) => {
      const db = projectDbs.find((db) => db.projectName === p.name);
      if (db && db.dbList.length > 0) {
        p.kvInstances = db.dbList.map((d) => {
          return {
            databaseId: d.databaseId,
            sizeBytes: d.sizeBytes,
            branch: d.branch,
          };
        });
      }
    });
  });

  await localKv.set([DEPLOY_RATE_LIMITER_PREFIX, session], Date.now(), {
    expireIn: _24_HOURS_IN_MS,
  });

  return deployUser;
}

export function deployKvEnvironment(
  project: DeployProject,
  instance: DeployKvInstance,
): Environment {
  if (project.type === "playground") {
    return "Deploy playground";
  } else if (project.type === "git") {
    return project.productionBranch === instance.branch ? "Deploy prod" : "Deploy preview";
  }
  return "other";
}

export async function executorId(session: string) {
  const deployUser: DeployUser | null = await getDeployUserData(session, true);
  if (deployUser) {
    return deployUser.name + ` (${deployUser.login})`;
  }
  return session;
}

export async function getDeployUserData(
  session: string,
  refreshIfNeeded: boolean,
): Promise<DeployUser | null> {
  let deployUser: DeployUser | null =
    (await localKv.get<DeployUser>([DEPLOY_USER_KEY_PREFIX, session])).value;

  if (deployUser === null && refreshIfNeeded) {
    const accessToken = await getEncryptedString([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, session]);

    if (accessToken) {
      try {
        const newDeployUser = await buildRemoteData(accessToken, session);
        if (newDeployUser) {
          logDebug({ sessionId: session }, "Successfully loaded new Deploy user data");
          await localKv.set([DEPLOY_USER_KEY_PREFIX, session], newDeployUser, {
            expireIn: _24_HOURS_IN_MS,
          });
          await persistConnectionData(newDeployUser);
          deployUser = newDeployUser;
        }
      } catch (e) {
        console.error(`Failed to fetch Deploy user details: ${e.message}`);
        await localKv.delete([DEPLOY_USER_KEY_PREFIX, session]);
        await localKv.delete([ENCRYPTED_USER_ACCESS_TOKEN_PREFIX, session]);
        return null;
      }
    }
  }
  return deployUser;
}
