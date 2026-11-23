import { NextResponse } from "next/server";
import {
  backendFetch,
  TOKEN_COOKIE,
  tokenCookieMaxAge,
} from "@/lib/auth";
import { homeForRole } from "@/lib/roles";
import type { Role, User } from "@/lib/types";

function fail(request: Request, code: string) {
  const url = new URL("/masuk", request.url);
  url.searchParams.set("s", code);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const code = incoming.searchParams.get("code");

  if (!code) {
    return fail(request, "oauth_cancelled");
  }

  let response: Response;
  try {
    response = await backendFetch("/auth/oauth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch {
    return fail(request, "oauth_failed");
  }

  const text = await response.text();
  let payload: {
    data?: { token?: string; user?: User };
    error?: { code?: string };
  } = {};

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    return fail(request, "oauth_failed");
  }

  const token = payload.data?.token;
  const user = payload.data?.user;
  if (!response.ok || !token || !user?.role) {
    return fail(
      request,
      payload.error?.code === "OAUTH_INVALID_CODE"
        ? "oauth_expired"
        : "oauth_failed",
    );
  }

  const destination = homeForRole(user.role as Role);
  const result = NextResponse.redirect(new URL(destination, incoming.origin));
  result.cookies.set({
    name: TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: tokenCookieMaxAge(token),
  });

  return result;
}
