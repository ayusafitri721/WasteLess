import { NextResponse } from "next/server";
import { backendFetch, TOKEN_COOKIE, tokenCookieMaxAge } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "Permintaan masuk tidak valid.",
        },
      },
      { status: 400 },
    );
  }

  let response: Response;
  try {
    response = await backendFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKEND_UNAVAILABLE",
          message:
            "Server WasteLess tidak dapat dihubungi. Coba lagi setelah server aktif.",
        },
      },
      { status: 502 },
    );
  }

  const text = await response.text();
  let payload: {
    success?: boolean;
    data?: {
      user?: unknown;
      token?: string;
    };
    error?: unknown;
  } = {};

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = {};
  }

  if (!response.ok || !payload.data?.token) {
    return new NextResponse(text || null, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  }

  const result = NextResponse.json({
    success: true,
    data: { user: payload.data.user },
  });

  result.cookies.set({
    name: TOKEN_COOKIE,
    value: payload.data.token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: tokenCookieMaxAge(payload.data.token),
  });

  return result;
}
