"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from "@/components/ui/states";
import { apiFetch, withQuery } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { distributionStatusLabels } from "@/lib/labels";
import { populatedListing, populatedUser } from "@/lib/relations";
import { useApi } from "@/lib/use-api";
import type {
  Distribution,
  DistributionStatus,
  Paginated,
} from "@/lib/types";

const statuses: DistributionStatus[] = [
  "pickup_ready",
  "verified",
  "completed",
  "failed",
];

function CompleteDistribution({
  distribution,
  onDone,
}: {
  distribution: Distribution;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function complete() {
    setError(null);
    setLoading(true);
    try {
      await apiFetch<{ distribution: Distribution }>(
        `/distributions/${distribution.id}/complete`,
        { method: "PATCH" },
      );
      setOpen(false);
      setDone(true);
    } catch (completeError) {
      setError(completeError);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-4 border-t border-line pt-4">
        <Notice tone="success">
          Distribusi selesai. Jumlah makanan sudah masuk ringkasan dampak Anda.
        </Notice>
        <Button variant="secondary" className="mt-3" onClick={onDone}>
          Muat ulang daftar
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <Button variant="primary" onClick={() => setOpen(true)}>
        Konfirmasi makanan sudah diterima
      </Button>
      {error ? (
        <p className="mt-3 text-sm text-muted">{errorMessage(error)}</p>
      ) : null}

      <Dialog
        open={open}
        title="Konfirmasi penyelesaian"
        onClose={() => {
          if (!loading) setOpen(false);
        }}
      >
        <p className="text-sm text-muted">
          Pastikan makanan sudah benar-benar Anda terima. Setelah dikonfirmasi,
          distribusi tercatat selesai dan tidak dapat dikembalikan.
        </p>
        {error ? (
          <div className="mt-4">
            <Notice tone="danger">{errorMessage(error)}</Notice>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="primary" loading={loading} onClick={complete}>
            Ya, konfirmasi selesai
          </Button>
          <Button
            variant="quiet"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Belum
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export default function ReceiverDistributionsPage() {
  const [status, setStatus] = useState<DistributionStatus | "">("");
  const [page, setPage] = useState(1);

  const path = useMemo(
    () =>
      withQuery("/distributions/history", {
        status,
        page,
        limit: 10,
      }),
    [status, page],
  );
  const distributions = useApi<Paginated<Distribution>>(path);

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Distribusi"
        title="Serah terima yang perlu Anda konfirmasi."
        description="Setelah penyedia memverifikasi pengambilan, konfirmasi bahwa makanan sudah diterima agar distribusi selesai dan tercatat sebagai dampak."
        actions={
          <Link href="/receiver/reservasi" className="btn btn-secondary">
            Ke reservasi
          </Link>
        }
      />

      <div className="max-w-xs">
        <label className="field-label" htmlFor="receiver-distribution-status">
          Filter status
        </label>
        <select
          id="receiver-distribution-status"
          className="field-select"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as DistributionStatus | "");
            setPage(1);
          }}
        >
          <option value="">Semua status</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {distributionStatusLabels[value]}
            </option>
          ))}
        </select>
      </div>

      {distributions.loading ? (
        <LoadingState label="Memuat distribusi..." />
      ) : distributions.error ? (
        <ErrorState
          message={distributions.error}
          onRetry={distributions.refetch}
        />
      ) : distributions.data && distributions.data.items.length > 0 ? (
        <div className="space-y-4">
          <ul className="space-y-4">
            {distributions.data.items.map((distribution) => {
              const listing = populatedListing(distribution.listingId);
              const provider = populatedUser(distribution.providerId);
              return (
                <li key={distribution.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="display text-xl">
                          {listing?.name ?? "Listing tidak tersedia"}
                        </h2>
                        <StatusBadge
                          label={
                            distributionStatusLabels[distribution.status]
                          }
                          status={distribution.status}
                        />
                      </div>
                      <p className="mt-2 text-sm">
                        <span className="font-bold">
                          {formatQuantity(
                            distribution.quantity,
                            distribution.unit,
                          )}
                        </span>{" "}
                        dari{" "}
                        {provider?.organizationName ??
                          provider?.name ??
                          "penyedia"}
                      </p>
                      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="inline text-muted">Dibuat: </dt>
                          <dd className="inline">
                            {formatDateTime(distribution.createdAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline text-muted">Diverifikasi: </dt>
                          <dd className="inline">
                            {formatDateTime(distribution.verifiedAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline text-muted">Selesai: </dt>
                          <dd className="inline">
                            {formatDateTime(distribution.completedAt)}
                          </dd>
                        </div>
                        {listing ? (
                          <div>
                            <dt className="inline text-muted">Alamat: </dt>
                            <dd className="inline">{listing.pickupAddress}</dd>
                          </div>
                        ) : null}
                        {provider?.phone ? (
                          <div>
                            <dt className="inline text-muted">Telepon: </dt>
                            <dd className="inline">{provider.phone}</dd>
                          </div>
                        ) : null}
                      </dl>
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

                  {distribution.status === "verified" ? (
                    <CompleteDistribution
                      distribution={distribution}
                      onDone={distributions.refetch}
                    />
                  ) : distribution.status === "pickup_ready" ? (
                    <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
                      Makanan siap diambil. Saat bertemu penyedia, terima kode
                      dari mereka dan sebutkan kembali agar pengambilan
                      terverifikasi.
                    </p>
                  ) : distribution.status === "completed" ? (
                    <p className="mt-4 border-t border-line pt-4 text-sm text-success">
                      Serah terima selesai dan sudah masuk ringkasan dampak.
                    </p>
                  ) : (
                    <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
                      Distribusi ini tidak selesai. Stok sudah dikembalikan oleh
                      job kedaluwarsa.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <Pagination
            pagination={distributions.data.pagination}
            onPage={setPage}
          />
        </div>
      ) : (
        <EmptyState
          title={
            status
              ? `Tidak ada distribusi berstatus ${distributionStatusLabels[status].toLowerCase()}.`
              : "Belum ada distribusi."
          }
          action={
            <Link href="/receiver/reservasi" className="btn btn-secondary">
              Buka reservasi
            </Link>
          }
        >
          Distribusi dibuat setelah penyedia menandai reservasi yang disetujui
          sebagai siap diambil.
        </EmptyState>
      )}
    </div>
  );
}
