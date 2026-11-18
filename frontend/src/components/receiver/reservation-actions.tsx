"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { Reservation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/auth/form-error";

export function ReceiverReservationActions({
  reservation,
  onDone,
}: {
  reservation: Reservation;
  onDone: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const cancellable =
    reservation.status === "pending" || reservation.status === "approved";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch<{ reservation: Reservation }>(
        `/reservations/${reservation.id}/cancel`,
        {
          method: "PATCH",
          body: JSON.stringify({ reason: reason.trim() || undefined }),
        },
      );
      setOpen(false);
      setReason("");
      await onDone();
    } catch (submitError) {
      setError(submitError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <FormError error={error} />

      {reservation.status === "pending" ? (
        <p className="text-sm text-muted">
          Menunggu penyedia menyetujui. Stok sudah dikurangi untuk permintaan
          ini.
        </p>
      ) : null}

      {reservation.status === "approved" ? (
        <p className="text-sm text-muted">
          Reservasi disetujui. Datang sesuai jadwal, lalu ikuti instruksi
          pengambilan dari penyedia.
        </p>
      ) : null}

      {reservation.status === "ready_for_pickup" ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            Makanan siap diambil. Saat bertemu penyedia, terima kode pengambilan
            dari mereka lalu sebutkan kembali agar penyedia dapat
            memverifikasinya di aplikasi.
          </p>
          <Link href="/receiver/distribusi" className="link-underline text-sm">
            Lihat status distribusi
          </Link>
        </div>
      ) : null}

      {reservation.status === "picked_up" ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            Pengambilan sudah diverifikasi. Konfirmasi bahwa makanan sudah
            diterima untuk menyelesaikan distribusi.
          </p>
          <Link href="/receiver/distribusi" className="btn btn-primary">
            Konfirmasi penyelesaian
          </Link>
        </div>
      ) : null}

      {reservation.status === "completed" ? (
        <p className="text-sm text-success">
          Reservasi selesai. Terima kasih sudah menyelamatkan makanan.
        </p>
      ) : null}

      {["rejected", "cancelled", "expired"].includes(reservation.status) ? (
        <p className="text-sm text-muted">
          Reservasi ini tidak dilanjutkan. Stok sudah dikembalikan ke listing.
        </p>
      ) : null}

      {cancellable ? (
        open ? (
          <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
            <Field
              label="Alasan pembatalan"
              htmlFor={`receiver-cancel-${reservation.id}`}
              optional
              hint="Alasan akan terlihat oleh penyedia."
            >
              <textarea
                id={`receiver-cancel-${reservation.id}`}
                className="field-textarea"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={reason.trim() ? 3 : undefined}
                maxLength={500}
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="danger" loading={loading}>
                Batalkan reservasi
              </Button>
              <Button
                type="button"
                variant="quiet"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                disabled={loading}
              >
                Kembali
              </Button>
            </div>
            {error ? (
              <p className="text-sm text-muted">{errorMessage(error)}</p>
            ) : null}
          </form>
        ) : (
          <Button
            variant="quiet"
            className="mt-3"
            onClick={() => {
              setOpen(true);
              setError(null);
            }}
          >
            Batalkan reservasi
          </Button>
        )
      ) : null}
    </div>
  );
}
