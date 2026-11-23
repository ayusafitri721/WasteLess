import { NextResponse } from "next/server";
import { backendOrigin } from "@/lib/auth";

const PROVIDERS = new Set(["google", "github"]);
const ROLES = new Set(["provider", "receiver"]);

function fail(request: Request, code: string) {
  const url = new URL("/masuk", request.url);
  url.searchParams.set("s", code);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const provider = incoming.searchParams.get("provider") ?? "";
  const role = incoming.searchParams.get("role") ?? "receiver";

  if (!PROVIDERS.has(provider) || !ROLES.has(role)) {
    return fail(request, "oauth_failed");
  }

  const target = new URL(
    `${backendOrigin()}/api/auth/oauth/${provider}/start`,
  );
  target.searchParams.set("role", role);

  let response: Response;
  try {
    response = await fetch(target.toString(), {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return fail(request, "oauth_failed");
  }

  if (response.status !== 302 && response.status !== 303) {
    return fail(
      request,
      response.status === 503 ? "oauth_not_configured" : "oauth_failed",
    );
  }

  const location = response.headers.get("location");
  if (!location) {
    return fail(request, "oauth_failed");
  }

  return NextResponse.redirect(location);
}
