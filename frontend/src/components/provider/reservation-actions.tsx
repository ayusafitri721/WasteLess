"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toDateTimeLocal } from "@/lib/format";
import { populatedListing } from "@/lib/relations";
import type {
  Distribution,
  Reservation,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/auth/form-error";

type Action = "approve" | "reject" | "cancel" | null;

export function ProviderReservationActions({
  reservation,
  onDone,
}: {
  reservation: Reservation;
  onDone: () => Promise<void> | void;
}) {
  const listing = populatedListing(reservation.listingId);
  const [action, setAction] = useState<Action>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [pickupSchedule, setPickupSchedule] = useState(
    reservation.pickupSchedule
      ? toDateTimeLocal(reservation.pickupSchedule)
      : "",
  );
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [readyLoading, setReadyLoading] = useState(false);
  const [pickupCode, setPickupCode] = useState("");
  const [copied, setCopied] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    setError(null);
    setLoading(true);

    try {
      const path =
        action === "approve"
          ? `/reservations/${reservation.id}/approve`
          : action === "reject"
            ? `/reservations/${reservation.id}/reject`
            : `/reservations/${reservation.id}/cancel`;

      const body =
        action === "approve"
          ? {
              pickupSchedule: pickupSchedule
                ? new Date(pickupSchedule).toISOString()
                : undefined,
              note: note.trim() || undefined,
            }
          : { reason: reason.trim() || undefined };

      await apiFetch<{ reservation: Reservation }>(path, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setAction(null);
      setReason("");
      setNote("");
      await onDone();
    } catch (submitError) {
      setError(submitError);
    } finally {
      setLoading(false);
    }
  }

  async function markReady() {
    setError(null);
    setReadyLoading(true);
    try {
      const data = await apiFetch<{
        reservation: Reservation;
        distribution: Distribution;
        pickupCode: string;
      }>(`/reservations/${reservation.id}/ready`, { method: "PATCH" });
      setPickupCode(data.pickupCode);
    } catch (readyError) {
      setError(readyError);
    } finally {
      setReadyLoading(false);
    }
  }

  async function copyCode() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pickupCode);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = pickupCode;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <FormError error={error} />

      {pickupCode ? (
        <div className="mt-1 border border-warning bg-paper p-4" role="status">
          <p className="text-sm font-bold text-warning">
            Kode pengambilan dibuat
          </p>
          <p className="mt-1 text-sm text-muted">
            Saat serah terima, tunjukkan kode ini kepada penerima lalu minta
            mereka menyebutkannya kembali untuk verifikasi. Kode tidak
            ditampilkan lagi setelah daftar dimuat ulang.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="mono text-3xl font-bold tracking-[0.2em]">
              {pickupCode}
            </span>
            <Button type="button" variant="secondary" onClick={copyCode}>
              {copied ? "Tersalin" : "Salin kode"}
            </Button>
          </div>
          <Button
            type="button"
            variant="quiet"
            className="mt-3"
            onClick={() => {
              setPickupCode("");
              void onDone();
            }}
          >
            Saya sudah mencatat kode, muat ulang daftar
          </Button>
        </div>
      ) : null}

      {pickupCode ? null : action === null ? (
        <div className="flex flex-wrap gap-3">
          {reservation.status === "pending" ? (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  setAction("approve");
                  setError(null);
                }}
              >
                Setujui
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setAction("reject");
                  setError(null);
                }}
              >
                Tolak
              </Button>
            </>
          ) : null}

          {reservation.status === "approved" ? (
            <>
              <Button variant="primary" loading={readyLoading} onClick={markReady}>
                Tandai siap diambil
              </Button>
              <Button
                variant="quiet"
                onClick={() => {
                  setAction("cancel");
                  setError(null);
                }}
              >
                Batalkan
              </Button>
            </>
          ) : null}

          {reservation.status === "ready_for_pickup" ? (
            <Link href="/provider/distribusi" className="btn btn-primary">
              Buka distribusi dan verifikasi kode
            </Link>
          ) : null}

          {reservation.status === "picked_up" ? (
            <p className="text-sm text-muted">
              Pengambilan sudah diverifikasi. Menunggu penerima mengonfirmasi
              penyelesaian distribusi.
            </p>
          ) : null}

          {reservation.status === "completed" ? (
            <p className="text-sm text-success">
              Distribusi selesai dan dampaknya sudah masuk ringkasan.
            </p>
          ) : null}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {action === "approve" ? (
            <>
              <Field
                label="Jadwal pengambilan"
                htmlFor={`approve-schedule-${reservation.id}`}
                hint="Jadwal wajib ada sebelum status siap diambil dapat dibuat."
              >
                <input
                  id={`approve-schedule-${reservation.id}`}
                  type="datetime-local"
                  className="field-input"
                  value={pickupSchedule}
                  onChange={(event) => setPickupSchedule(event.target.value)}
                  min={toDateTimeLocal(new Date().toISOString())}
                  max={
                    listing ? toDateTimeLocal(listing.pickupDeadline) : undefined
                  }
                  required
                />
              </Field>
              <Field
                label="Catatan untuk penerima"
                htmlFor={`approve-note-${reservation.id}`}
                optional
              >
                <textarea
                  id={`approve-note-${reservation.id}`}
                  className="field-textarea"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                />
              </Field>
            </>
          ) : (
            <Field
              label={action === "reject" ? "Alasan penolakan" : "Alasan pembatalan"}
              htmlFor={`reason-${reservation.id}`}
              optional={action === "cancel"}
              hint="Alasan dilihat oleh penerima pada catatan reservasi."
            >
              <textarea
                id={`reason-${reservation.id}`}
                className="field-textarea"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={action === "reject" ? 3 : undefined}
                maxLength={500}
                required={action === "reject"}
              />
            </Field>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              variant={action === "reject" ? "danger" : "primary"}
              loading={loading}
            >
              {action === "approve"
                ? "Setujui reservasi"
                : action === "reject"
                  ? "Tolak reservasi"
                  : "Batalkan reservasi"}
            </Button>
            <Button
              type="button"
              variant="quiet"
              onClick={() => {
                setAction(null);
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
      )}

      {action === null && error ? (
        <p className="mt-3 text-sm text-muted">{errorMessage(error)}</p>
      ) : null}
    </div>
  );
}
