import { NextResponse } from "next/server";
import { backendFetch, TOKEN_COOKIE } from "@/lib/auth";

function cookieMaxAge(token: string) {
  try {
    const payload = token.split(".")[1];
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };
    if (typeof parsed.exp === "number") {
      return Math.max(60, parsed.exp - Math.floor(Date.now() / 1000));
    }
  } catch {
    // Fall back to the backend's default 15 minute access token.
  }
  return 15 * 60;
}

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
    maxAge: cookieMaxAge(payload.data.token),
  });

  return result;
}
