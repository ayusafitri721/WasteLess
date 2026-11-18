"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
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

function PickupVerifier({
  distribution,
  onDone,
}: {
  distribution: Distribution;
  onDone: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch<{ distribution: Distribution }>(
        `/distributions/${distribution.id}/verify-pickup`,
        {
          method: "PATCH",
          body: JSON.stringify({ code: code.trim() }),
        },
      );
      setVerified(true);
    } catch (submitError) {
      setError(submitError);
    } finally {
      setLoading(false);
    }
  }

  if (verified) {
    return (
      <div className="mt-4">
        <Notice tone="success">
          Pengambilan terverifikasi. Status reservasi menjadi sudah diambil.
          Penerima kini dapat mengonfirmasi penyelesaian distribusi.
        </Notice>
        <Button variant="secondary" className="mt-3" onClick={onDone}>
          Muat ulang daftar
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 border-t border-line pt-4"
      noValidate
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-[14rem]">
          <Field
            label="Kode pengambilan"
            htmlFor={`pickup-code-${distribution.id}`}
            hint="Minta penerima menyebutkan kode yang Anda berikan."
          >
            <input
              id={`pickup-code-${distribution.id}`}
              className="field-input mono tracking-[0.2em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
            />
          </Field>
        </div>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={code.length !== 6}
        >
          Verifikasi kode
        </Button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-muted">{errorMessage(error)}</p>
      ) : null}
    </form>
  );
}

export default function ProviderDistributionsPage() {
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
        title="Serah terima yang tercatat."
        description="Minta penerima menyebutkan kembali kode yang Anda berikan, lalu verifikasi di sini. Penerima menyelesaikan distribusi setelah menerima makanan."
        actions={
          <Link href="/provider/reservasi" className="btn btn-secondary">
            Ke reservasi
          </Link>
        }
      />

      <div className="max-w-xs">
        <label className="field-label" htmlFor="distribution-status">
          Filter status
        </label>
        <select
          id="distribution-status"
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
              const receiver = populatedUser(distribution.receiverId);
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
                        Untuk{" "}
                        <span className="font-bold">
                          {receiver?.organizationName ??
                            receiver?.name ??
                            "Penerima"}
                        </span>{" "}
                        ·{" "}
                        {formatQuantity(distribution.quantity, distribution.unit)}
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
                        {receiver?.phone ? (
                          <div>
                            <dt className="inline text-muted">Telepon: </dt>
                            <dd className="inline">{receiver.phone}</dd>
                          </div>
                        ) : null}
                        {listing ? (
                          <div className="sm:col-span-2">
                            <dt className="inline text-muted">Alamat: </dt>
                            <dd className="inline">{listing.pickupAddress}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  </div>

                  {distribution.status === "pickup_ready" ? (
                    <PickupVerifier
                      distribution={distribution}
                      onDone={distributions.refetch}
                    />
                  ) : distribution.status === "verified" ? (
                    <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
                      Pengambilan terverifikasi. Menunggu penerima mengonfirmasi
                      penyelesaian.
                    </p>
                  ) : distribution.status === "completed" ? (
                    <p className="mt-4 border-t border-line pt-4 text-sm text-success">
                      Distribusi selesai dan sudah masuk ringkasan dampak.
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
            <Link href="/provider/reservasi" className="btn btn-secondary">
              Buka reservasi
            </Link>
          }
        >
          Distribusi dibuat ketika Anda menandai reservasi yang disetujui
          sebagai siap diambil.
        </EmptyState>
      )}
    </div>
  );
}
