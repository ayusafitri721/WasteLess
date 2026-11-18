import { NextResponse } from "next/server";
import { backendFetch, getToken } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["auth/register"]);
const BLOCKED_PATHS = new Set(["auth/login", "auth/logout"]);

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const joined = path.join("/");

  if (BLOCKED_PATHS.has(joined)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Endpoint tidak tersedia." },
      },
      { status: 404 },
    );
  }

  const token = await getToken();
  if (!token && !PUBLIC_PATHS.has(joined)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Sesi tidak ditemukan." },
      },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const method = request.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text();

  let response: Response;
  try {
    response = await backendFetch(`${joined}${url.search}`, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(20000),
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

  const responseBody = await response.text();
  const responseHeaders = new Headers();
  const responseType = response.headers.get("content-type");
  if (responseType) {
    responseHeaders.set("Content-Type", responseType);
  }
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    responseHeaders.set("Retry-After", retryAfter);
  }

  return new NextResponse(responseBody || null, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function GET(request: Request, context: RouteContext) {
  return forward(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return forward(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return forward(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return forward(request, context);
}
