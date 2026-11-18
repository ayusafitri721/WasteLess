"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/states";
import { ReceiverReservationActions } from "@/components/receiver/reservation-actions";
import { withQuery } from "@/lib/api";
import { formatDateTime, formatDeadline, formatQuantity } from "@/lib/format";
import { reservationStatusLabels } from "@/lib/labels";
import { populatedListing, populatedUser } from "@/lib/relations";
import { useApi } from "@/lib/use-api";
import type { Paginated, Reservation, ReservationStatus } from "@/lib/types";

const statuses: ReservationStatus[] = [
  "pending",
  "approved",
  "ready_for_pickup",
  "picked_up",
  "completed",
  "rejected",
  "cancelled",
  "expired",
];

export default function ReceiverReservationsPage() {
  const [status, setStatus] = useState<ReservationStatus | "">("");
  const [page, setPage] = useState(1);

  const path = useMemo(
    () =>
      withQuery("/reservations/my", {
        status,
        page,
        limit: 10,
      }),
    [status, page],
  );
  const reservations = useApi<Paginated<Reservation>>(path);

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Reservasi"
        title="Permintaan yang Anda kirim."
        description="Stok berkurang saat permintaan dikirim. Jika ditolak, dibatalkan, atau kedaluwarsa, stok kembali ke listing secara otomatis."
        actions={
          <Link href="/receiver/makanan" className="btn btn-primary">
            Cari makanan
          </Link>
        }
      />

      <div className="max-w-xs">
        <label className="field-label" htmlFor="receiver-reservation-status">
          Filter status
        </label>
        <select
          id="receiver-reservation-status"
          className="field-select"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ReservationStatus | "");
            setPage(1);
          }}
        >
          <option value="">Semua status</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {reservationStatusLabels[value]}
            </option>
          ))}
        </select>
      </div>

      {reservations.loading ? (
        <LoadingState label="Memuat reservasi..." />
      ) : reservations.error ? (
        <ErrorState
          message={reservations.error}
          onRetry={reservations.refetch}
        />
      ) : reservations.data && reservations.data.items.length > 0 ? (
        <div className="space-y-4">
          <ul className="space-y-4">
            {reservations.data.items.map((reservation) => {
              const listing = populatedListing(reservation.listingId);
              const provider = populatedUser(reservation.providerId);
              return (
                <li key={reservation.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="display text-xl">
                          {listing?.name ?? "Listing tidak tersedia"}
                        </h2>
                        <StatusBadge
                          label={reservationStatusLabels[reservation.status]}
                          status={reservation.status}
                        />
                      </div>
                      <p className="mt-2 text-sm">
                        <span className="font-bold">
                          {formatQuantity(
                            reservation.quantity,
                            listing?.unit ?? "",
                          )}
                        </span>{" "}
                        dari{" "}
                        {provider?.organizationName ??
                          provider?.name ??
                          "penyedia"}
                      </p>
                      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="inline text-muted">Diajukan: </dt>
                          <dd className="inline">
                            {formatDateTime(reservation.createdAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline text-muted">Jadwal ambil: </dt>
                          <dd className="inline">
                            {formatDateTime(reservation.pickupSchedule)}
                          </dd>
                        </div>
                        {listing ? (
                          <>
                            <div>
                              <dt className="inline text-muted">Batas ambil: </dt>
                              <dd className="inline">
                                {formatDateTime(listing.pickupDeadline)} (
                                {formatDeadline(listing.pickupDeadline)})
                              </dd>
                            </div>
                            <div>
                              <dt className="inline text-muted">Alamat: </dt>
                              <dd className="inline">{listing.pickupAddress}</dd>
                            </div>
                          </>
                        ) : null}
                        {provider?.phone ? (
                          <div>
                            <dt className="inline text-muted">Telepon: </dt>
                            <dd className="inline">{provider.phone}</dd>
                          </div>
                        ) : null}
                      </dl>
                      {reservation.statusNote ? (
                        <p className="mt-3 border-l-2 border-line pl-3 text-sm text-muted">
                          Catatan: {reservation.statusNote}
                        </p>
                      ) : null}
                    </div>
                    {listing ? (
                      <Link
                        href={`/receiver/makanan/${listing.id}`}
                        className="link-underline text-sm"
                      >
                        Lihat makanan
                      </Link>
                    ) : null}
                  </div>

                  <ReceiverReservationActions
                    reservation={reservation}
                    onDone={reservations.refetch}
                  />
                </li>
              );
            })}
          </ul>
          <Pagination
            pagination={reservations.data.pagination}
            onPage={setPage}
          />
        </div>
      ) : (
        <EmptyState
          title={
            status
              ? `Tidak ada reservasi berstatus ${reservationStatusLabels[status].toLowerCase()}.`
              : "Belum ada reservasi."
          }
          action={
            <Link href="/receiver/makanan" className="btn btn-primary">
              Cari makanan tersedia
            </Link>
          }
        >
          Pilih makanan yang masih dalam batas pengambilan, lalu kirim
          permintaan ke penyedia.
        </EmptyState>
      )}
    </div>
  );
}
