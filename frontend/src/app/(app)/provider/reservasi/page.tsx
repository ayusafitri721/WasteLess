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
import { ProviderReservationActions } from "@/components/provider/reservation-actions";
import { withQuery } from "@/lib/api";
import { formatDateTime, formatQuantity } from "@/lib/format";
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
];

export default function ProviderReservationsPage() {
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
        title="Permintaan dari penerima."
        description="Setujui dengan jadwal pengambilan yang jelas, atau tolak dengan alasan yang bisa dibaca penerima. Kode pengambilan dibuat saat status siap diambil."
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-xs">
          <label className="field-label" htmlFor="reservation-status">
            Filter status
          </label>
          <select
            id="reservation-status"
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
        <Link href="/provider/listing" className="btn btn-secondary">
          Kelola listing
        </Link>
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
              const receiver = populatedUser(reservation.receiverId);
              return (
                <li key={reservation.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="display text-xl">
                          {listing?.name ?? "Listing tidak tersedia"}
                        </h2>
                        <StatusBadge
                          label={
                            reservationStatusLabels[reservation.status]
                          }
                          status={reservation.status}
                        />
                      </div>
                      <p className="mt-2 text-sm">
                        <span className="font-bold">
                          {receiver?.organizationName ??
                            receiver?.name ??
                            "Penerima"}
                        </span>{" "}
                        meminta{" "}
                        {formatQuantity(
                          reservation.quantity,
                          listing?.unit ?? "",
                        )}
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
                        {receiver?.phone ? (
                          <div>
                            <dt className="inline text-muted">Telepon: </dt>
                            <dd className="inline">{receiver.phone}</dd>
                          </div>
                        ) : null}
                        {listing ? (
                          <div>
                            <dt className="inline text-muted">Alamat: </dt>
                            <dd className="inline">{listing.pickupAddress}</dd>
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
                        href={`/provider/listing/${listing.id}`}
                        className="link-underline text-sm"
                      >
                        Lihat listing
                      </Link>
                    ) : null}
                  </div>

                  <ProviderReservationActions
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
            <Link href="/provider/listing" className="btn btn-secondary">
              Periksa listing
            </Link>
          }
        >
          Permintaan penerima akan muncul setelah listing Anda tersedia dan
          akun penerima sudah terverifikasi.
        </EmptyState>
      )}
    </div>
  );
}
