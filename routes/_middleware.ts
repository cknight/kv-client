import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getCookies, setCookie } from "$std/http/cookie.ts";

export async function handler(req: Request, ctx: MiddlewareHandlerContext) {
  const start = Date.now();

  if (ctx.destination === "route") {
    const cookies = getCookies(req.headers);
    let session = cookies.session;
    console.debug("Session: ", session);

    if (session) {
      ctx.state.session = cookies.session;
    } else {
      session = crypto.randomUUID();
      ctx.state.session = session;
      console.debug("New Session: ", session);
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
    logRequest(start, req, resp);
    return resp;
  }

  const resp = await ctx.next();

  logRequest(start, req, resp);
  return resp;
}

function logRequest(start: number, req: Request, resp: Response) {
  const url = req.url;
  if (
    !url.includes("favicon.ico") &&
    !url.endsWith(".css") &&
    !url.includes("_frsh") &&
    !url.endsWith(".js")
  ) {
    console.log(`--- ${req.method} ${req.url} ${Date.now() - start}ms ${resp.status}`);
  }
}
