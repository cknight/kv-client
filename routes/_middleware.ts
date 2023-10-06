import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getCookies, setCookie } from "$std/http/cookie.ts";

export async function handler(req: Request, ctx:MiddlewareHandlerContext) {
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
  
    return resp;
  }

  return await ctx.next();
}