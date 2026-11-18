import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homeForRole } from "./roles";
import type { Role, User } from "./types";

export const TOKEN_COOKIE = "wasteless_token";

export class BackendUnavailableError extends Error {
  constructor() {
    super("Server WasteLess tidak dapat dihubungi.");
    this.name = "BackendUnavailableError";
  }
}

export function backendUrl(path: string) {
  const base = process.env.BACKEND_API_URL;
  if (!base) {
    throw new Error("BACKEND_API_URL belum diatur.");
  }
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function backendFetch(path: string, init: RequestInit = {}) {
  try {
    return await fetch(backendUrl(path), {
      ...init,
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new BackendUnavailableError();
    }
    throw new BackendUnavailableError();
  }
}

export async function getToken() {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getToken();
  if (!token) return null;

  const response = await backendFetch("/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new BackendUnavailableError();
  }

  const body = (await response.json()) as { data: { user: User } };
  return body.data.user;
}

export async function requireUser(role?: Role | Role[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/masuk");
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) {
      redirect(homeForRole(user.role));
    }
  }

  return user;
}
