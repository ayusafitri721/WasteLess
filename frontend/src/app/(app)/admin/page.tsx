"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from "@/components/ui/states";
import { useApi } from "@/lib/use-api";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { roleLabels, unitLabels } from "@/lib/labels";
import type {
  Paginated,
  PlatformAnalytics,
  Verification,
} from "@/lib/types";

export default function AdminDashboardPage() {
  const analytics = useApi<PlatformAnalytics>("/analytics/platform");
  const pending = useApi<Paginated<Verification>>(
    "/admin/verifications?status=pending&limit=5&page=1",
  );

  if (analytics.error) {
    return <ErrorState message={analytics.error} onRetry={analytics.refetch} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Ringkasan admin"
        title="Antrean dan kondisi platform."
        description="Angka di bawah dihitung langsung dari basis data. Tinjau pengajuan verifikasi lebih dulu karena status itu membuka alur utama pengguna."
        actions={
          <Link href="/admin/verifikasi" className="btn btn-primary">
            Buka antrean verifikasi
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section aria-labelledby="verification-queue-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="kicker">Perlu tindakan</p>
              <h2 id="verification-queue-title" className="display mt-1 text-2xl">
                Pengajuan menunggu
              </h2>
            </div>
            <Link href="/admin/verifikasi" className="link-underline text-sm">
              Lihat semua
            </Link>
          </div>

          <div className="mt-4">
            {pending.loading ? (
              <LoadingState label="Memuat pengajuan..." />
            ) : pending.error ? (
              <ErrorState message={pending.error} onRetry={pending.refetch} />
            ) : pending.data && pending.data.items.length > 0 ? (
              <ul className="panel data-list overflow-hidden">
                {pending.data.items.map((verification) => {
                  const applicant =
                    typeof verification.userId === "string"
                      ? null
                      : verification.userId;
                  return (
                    <li key={verification.id} className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">
                            {verification.organizationName}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {applicant?.name ?? "Pengguna"} ·{" "}
                            {applicant ? roleLabels[applicant.role] : "-"}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Diajukan {formatDateTime(verification.createdAt)}
                          </p>
                        </div>
                        <Link
                          href="/admin/verifikasi"
                          className="btn btn-secondary"
                        >
                          Tinjau
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                title="Tidak ada pengajuan menunggu."
                action={
                  <Link href="/admin/verifikasi" className="btn btn-secondary">
                    Buka halaman verifikasi
                  </Link>
                }
              >
                Antrean kosong. Pengguna baru akan muncul di sini setelah
                mengirim data organisasi.
              </EmptyState>
            )}
          </div>
        </section>

        <aside className="panel h-fit p-5" aria-labelledby="users-title">
          <p className="kicker">Pengguna</p>
          <h2 id="users-title" className="display mt-1 text-2xl">
            Komposisi akun
          </h2>
          {analytics.loading ? (
            <p className="mt-4 text-sm text-muted">Memuat angka...</p>
          ) : analytics.data ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted">Total pengguna</span>
                <span className="font-bold">{analytics.data.users.total}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Terverifikasi</span>
                <span className="font-bold">{analytics.data.users.verified}</span>
              </div>
              <div className="divider my-4" />
              {Object.entries(analytics.data.users.byRole).map(
                ([role, count]) => (
                  <div key={role} className="flex justify-between gap-3">
                    <span className="text-muted">
                      {roleLabels[role as keyof typeof roleLabels]}
                    </span>
                    <span className="font-bold">{count}</span>
                  </div>
                ),
              )}
            </div>
          ) : null}
        </aside>
      </div>

      <section aria-labelledby="operations-title">
        <p className="kicker">Operasi</p>
        <h2 id="operations-title" className="display mt-1 text-2xl">
          Status alur utama
        </h2>

        {analytics.loading ? (
          <div className="mt-4">
            <LoadingState label="Memuat ringkasan platform..." />
          </div>
        ) : analytics.data ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="panel p-5">
              <p className="text-sm font-bold">Listing</p>
              <p className="display mt-1 text-3xl">{analytics.data.listings.total}</p>
              <p className="mt-2 text-sm text-muted">
                {analytics.data.listings.byStatus.available ?? 0} tersedia ·{" "}
                {analytics.data.listings.byStatus.completed ?? 0} selesai
              </p>
            </div>
            <div className="panel p-5">
              <p className="text-sm font-bold">Reservasi</p>
              <p className="display mt-1 text-3xl">
                {analytics.data.reservations.total}
              </p>
              <p className="mt-2 text-sm text-muted">
                {analytics.data.reservations.byStatus.pending ?? 0} menunggu ·{" "}
                {analytics.data.reservations.byStatus.completed ?? 0} selesai
              </p>
            </div>
            <div className="panel p-5">
              <p className="text-sm font-bold">Distribusi</p>
              <p className="display mt-1 text-3xl">
                {analytics.data.distributions.total}
              </p>
              <p className="mt-2 text-sm text-muted">
                {analytics.data.distributions.byStatus.completed ?? 0} selesai ·{" "}
                {analytics.data.distributions.byStatus.failed ?? 0} gagal
              </p>
            </div>
            <div className="panel p-5">
              <p className="text-sm font-bold">Makanan tersalurkan</p>
              {analytics.data.completedQuantityByUnit.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {analytics.data.completedQuantityByUnit.map((item) => (
                    <p key={item.unit} className="display text-2xl">
                      {formatQuantity(item.quantity, unitLabels[item.unit])}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">Belum ada.</p>
              )}
            </div>
          </div>
        ) : null}
      </section>

      {analytics.data &&
      analytics.data.reservations.byStatus.expired > 0 ? (
        <Notice tone="info">
          Ada {analytics.data.reservations.byStatus.expired} reservasi
          kedaluwarsa. Job expiration sudah mengembalikan stok dan menggagalkan
          distribusi yang belum diambil.
        </Notice>
      ) : null}
    </div>
  );
}
