import { FreshContext } from "$fresh/server.ts";
import { getCookies, setCookie } from "$std/http/cookie.ts";
import { getDeployUserData } from "../utils/connections/denoDeploy/deployUser.ts";
import { logDebug, logInfo } from "../utils/log.ts";
import { userNames } from "../utils/state/state.ts";

export async function handler(req: Request, ctx: FreshContext) {
  const start = Date.now();

  const cookies = getCookies(req.headers);
  let session = cookies.session;
  if (ctx.destination === "route") {
    if (session) {
      ctx.state.session = cookies.session;
      const deployUser = await getDeployUserData(cookies.session, true);
      if (deployUser) {
        userNames.set(cookies.session, deployUser.login);
      }
    } else {
      session = crypto.randomUUID();
      ctx.state.session = session;
      logDebug({ sessionId: session }, "New Session: ", session);
    }
    
    const resp = await ctx.next();
    
    if (!cookies.session) {
      setCookie(resp.headers, {
        name: "session",
        value: session,
        httpOnly: true,
        secure: true,
      });
    }
    logRequest(session, start, req, resp);
    return resp;
  }

  const resp = await ctx.next();

  logRequest(session, start, req, resp);
  return resp;
}

function logRequest(session: string, start: number, req: Request, resp: Response) {
  const url = req.url;
  if (
    !url.includes("favicon.ico") &&
    !url.endsWith(".css") &&
    !url.includes("_frsh") &&
    !url.endsWith(".js")
  ) {
    logInfo(
      { sessionId: session },
      `[${req.method}] ${req.url} ${Date.now() - start}ms ${resp.status}`,
    );
  }
}
