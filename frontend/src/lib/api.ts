import { ApiError } from "./errors";

type ApiEnvelope<T> = {
  success: true;
  data: T;
};

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`/api/proxy/${path.replace(/^\//, "")}`, {
      ...init,
      headers,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
    );
  }

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("wasteless:unauthorized"));
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const envelope = body as
      | {
          error?: { code?: string; message?: string; details?: unknown };
        }
      | null;
    throw new ApiError(
      response.status,
      envelope?.error?.code ?? "REQUEST_FAILED",
      envelope?.error?.message ?? "Permintaan gagal diproses.",
      envelope?.error?.details,
    );
  }

  return (body as ApiEnvelope<T>).data;
}

export function withQuery(
  path: string,
  params: Record<string, string | number | undefined | null>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
