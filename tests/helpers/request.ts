import { NextRequest } from "next/server";
import { signAccessToken } from "@/lib/jwt";

type SimpleRequestInit = Omit<RequestInit, "signal"> & { signal?: AbortSignal };

/** Builds a NextRequest carrying a valid accessToken cookie for the given user. */
export async function authedRequest(
  url: string,
  user: { id: string; email: string; name: string },
  init: SimpleRequestInit = {}
) {
  const token = await signAccessToken(user);
  const headers = new Headers(init.headers);
  const existingCookie = headers.get("cookie");
  headers.set("cookie", [existingCookie, `accessToken=${token}`].filter(Boolean).join("; "));
  return new NextRequest(url, { ...init, headers });
}
