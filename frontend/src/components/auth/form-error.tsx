import { ApiError } from "@/lib/errors";

export function FormError({ error }: { error: unknown }) {
  if (!error) return null;

  const details =
    error instanceof ApiError && Array.isArray(error.details)
      ? (error.details as Array<{ path?: string; message?: string }>)
      : [];

  return (
    <div className="notice notice-danger" role="alert">
      <p className="notice-title">
        {error instanceof Error ? error.message : "Permintaan gagal."}
      </p>
      {details.length > 0 ? (
        <ul className="notice-body list-disc space-y-1 pl-5">
          {details.map((detail, index) => (
            <li key={`${detail.path ?? "field"}-${index}`}>
              {detail.path ? `${detail.path}: ` : ""}
              {detail.message ?? "Nilai tidak valid"}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
