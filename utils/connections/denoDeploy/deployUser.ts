import { Environment } from "../../../types.ts";
import { getUserState } from "../../state/state.ts";
import { getOrganizationDetail, getProjectDbs, getRootData } from "./dash.ts";

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

export async function buildRemoteData(accessToken: string): Promise<DeployUser> {
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
    deployUser.organisations.push({
      id: o.id,
      name: o.name,
      projects: o.projects.map((p) => {
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

  return deployUser;
}

export function deployKvEnvironment(
  project: DeployProject,
  instance: DeployKvInstance,
): Environment {
  if (project.type === "playground") {
    return "playground";
  } else if (project.type === "git") {
    return project.productionBranch === instance.branch ? "prod" : "preview";
  }
  return "other";
}

export function executorId(session: string) {
  const userState = getUserState(session);
  if (userState && userState.deployUserData) {
    return userState.deployUserData.name + ` (${userState.deployUserData.login})`;
  }
  return session;
}
