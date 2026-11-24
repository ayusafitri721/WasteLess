import { ApiError } from "@/lib/errors";
import { fieldLabel } from "@/lib/labels";

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
          {details.map((detail, index) => {
            const label = fieldLabel(detail.path);
            const message = detail.message ?? "Nilai tidak valid";
            const text =
              label && !message.toLowerCase().startsWith(label.toLowerCase())
                ? `${label}: ${message}`
                : message;

            return (
              <li key={`${detail.path ?? "field"}-${index}`}>{text}</li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
