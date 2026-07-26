import { NextRequest, NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/jwt";

const PUBLIC_PATHS = ["/", "/signin", "/signup"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

const AUTH_PAGES = ["/signin", "/signup"];

function isAuthPage(pathname: string) {
  return AUTH_PAGES.includes(pathname);
}

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    /\.[^/]+$/.test(pathname)
  );
}

function isPublicApi(pathname: string) {
  return pathname.startsWith("/api/auth");
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * AUD-027: defense-in-depth against CSRF. SameSite=Lax on the auth cookies already
 * blocks the classic cross-site form-POST attack in modern browsers, but that's the
 * only defense currently in place — no Origin/Referer check backs it up. This rejects
 * state-changing API requests whose Origin header doesn't match the app's own origin.
 * Requests with no Origin header at all are let through rather than blocked outright,
 * since some legitimate same-origin requests omit it; this is a supplementary check; it
 * does not replace SameSite as the primary defense.
 */
function hasCrossOriginMismatch(req: NextRequest): boolean {
  if (SAFE_METHODS.has(req.method)) return false;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== req.nextUrl.host;
  } catch {
    return true;
  }
}

async function getUser(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const accessToken = req.cookies.get("accessToken")?.value;

  async function tryRefresh() {
    if (!refreshToken) return { user: null, refreshResponse: null };

    try {
      const refreshRes = await fetch(new URL("/api/auth/refresh", req.url), {
        method: "POST",
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });

      if (refreshRes.ok) {
        return { user: "refreshed", refreshResponse: refreshRes };
      }
    } catch {}

    return { user: null, refreshResponse: null };
  }

  if (!accessToken) {
    return tryRefresh();
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    return { user: payload, refreshResponse: null };
  } catch {
    return tryRefresh();
  }
}

function forwardCookies(from: Response, to: NextResponse) {
  const setCookies = from.headers.getSetCookie();
  for (const cookie of setCookies) {
    to.headers.append("Set-Cookie", cookie);
  }
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // AUD-027: checked before the public-API bypass below, so it also covers
  // /api/auth/* — login-CSRF (tricking a browser into submitting a cross-site sign-in)
  // is exactly the kind of request that bypass would otherwise let straight through.
  if (isApiPath(pathname) && hasCrossOriginMismatch(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  if (isPublicApi(pathname)) {
    return NextResponse.next();
  }

  const { user, refreshResponse } = await getUser(req);
  const isAuthenticated = user !== null;

  if (isAuthenticated && isAuthPage(pathname)) {
    const res = NextResponse.redirect(new URL("/organizations", req.url));
    if (refreshResponse) forwardCookies(refreshResponse, res);
    return res;
  }
  if (isPublicPath(pathname)) {
    const res = NextResponse.next();
    if (refreshResponse) forwardCookies(refreshResponse, res);
    return res;
  }

  if (!isAuthenticated) {
    // AUD-028: an API caller previously received a 307 redirect to the (HTML) signin
    // page — a fetch() client following it transparently sees a 200 OK with HTML in
    // the body, not the 401 its `res.ok` check is looking for. Page navigations still
    // get the redirect; API calls now get a real 401 JSON response.
    if (isApiPath(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signinUrl = new URL("/signin", req.url);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  const res = NextResponse.next();
  if (refreshResponse) forwardCookies(refreshResponse, res);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
