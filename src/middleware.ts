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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isStaticAsset(pathname) || isPublicApi(pathname)) {
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
