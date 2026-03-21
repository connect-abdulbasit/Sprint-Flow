import { NextRequest, NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/jwt";

const PUBLIC_PATHS = ["/", "/signin", "/signup", "/api/auth", "/favicon.ico"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/static")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("accessToken")?.value;
  if (!accessToken) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  try {
    await verifyAccessToken(accessToken);
    return NextResponse.next();
  } catch {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const refreshRes = await fetch(new URL("/api/auth/refresh", req.url), {
      method: "POST",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (refreshRes.ok) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/signin", req.url));
  }
}

export const config = {
  matcher: ["/workspace/:path*"],
};
