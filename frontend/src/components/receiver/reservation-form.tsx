"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toDateTimeLocal } from "@/lib/format";
import type { Listing, Reservation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/auth/form-error";

export function ReservationForm({
  listing,
  onCreated,
}: {
  listing: Listing;
  onCreated: () => Promise<void> | void;
}) {
  const [quantity, setQuantity] = useState("1");
  const [pickupSchedule, setPickupSchedule] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setClientError(null);

    const parsed = Number(quantity);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setClientError("Jumlah harus lebih dari 0.");
      return;
    }
    if (parsed > listing.availableQuantity) {
      setClientError(
        `Jumlah melebihi stok tersedia (${listing.availableQuantity} ${listing.unit}).`,
      );
      return;
    }

    setLoading(true);
    try {
      await apiFetch<{ reservation: Reservation }>("/reservations", {
        method: "POST",
        body: JSON.stringify({
          listingId: listing.id,
          quantity: parsed,
          pickupSchedule: pickupSchedule
            ? new Date(pickupSchedule).toISOString()
            : undefined,
        }),
      });
      await onCreated();
    } catch (submitError) {
      setError(submitError);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormError error={error} />
      {clientError ? (
        <div
          className="border-l-4 border-danger bg-surface px-4 py-3 text-sm"
          role="alert"
        >
          <p className="font-bold text-danger">Periksa isian</p>
          <p className="mt-1">{clientError}</p>
        </div>
      ) : null}

      <Field
        label="Jumlah yang diambil"
        htmlFor="reservation-quantity"
        hint={`Tersedia ${listing.availableQuantity} ${listing.unit}. Stok berkurang segera setelah reservasi dikirim.`}
      >
        <input
          id="reservation-quantity"
          type="number"
          min="0.01"
          max={listing.availableQuantity}
          step="0.01"
          className="field-input"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />
      </Field>

      <Field
        label="Rencana waktu pengambilan"
        htmlFor="reservation-schedule"
        optional
        hint="Penyedia dapat menyesuaikan jadwal saat menyetujui. Tidak boleh melewati batas pengambilan."
      >
        <input
          id="reservation-schedule"
          type="datetime-local"
          className="field-input"
          value={pickupSchedule}
          onChange={(event) => setPickupSchedule(event.target.value)}
          max={toDateTimeLocal(listing.pickupDeadline)}
        />
      </Field>

      <Button type="submit" loading={loading} className="w-full">
        Kirim permintaan reservasi
      </Button>
      <p className="text-xs text-muted">
        Permintaan belum final sampai penyedia menyetujui. Anda dapat
        membatalkan reservasi yang masih menunggu atau sudah disetujui.
      </p>
      {error ? (
        <p className="text-sm text-muted">{errorMessage(error)}</p>
      ) : null}
    </form>
  );
}
