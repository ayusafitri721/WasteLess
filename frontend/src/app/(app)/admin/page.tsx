"use client";

import Link from "next/link";
import { StatusDiagram } from "@/components/analytics/status-diagram";
import { ActionNeeded, type ActionItem } from "@/components/dashboard/action-needed";
import { ExportImpactButton } from "@/components/dashboard/export-impact-button";
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

function percent(value: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
}

export default function AdminDashboardPage() {
  const analytics = useApi<PlatformAnalytics>("/analytics/platform");
  const pending = useApi<Paginated<Verification>>(
    "/admin/verifications?status=pending&limit=5&page=1",
  );

  const completedDistributions =
    analytics.data?.completedQuantityByUnit.reduce(
      (sum, item) => sum + item.distributions,
      0,
    ) ?? 0;
  const volumeText =
    analytics.data?.completedQuantityByUnit
      .map((item) => formatQuantity(item.quantity, unitLabels[item.unit]))
      .join(" · ") ?? "";

  const actionItems: ActionItem[] = [];
  const verificationCount = pending.data?.pagination.total ?? 0;
  if (verificationCount > 0) {
    actionItems.push({
      label: "Tinjau verifikasi",
      detail: `${verificationCount} pengajuan menunggu keputusan.`,
      href: "/admin/verifikasi",
    });
  }
  const unverifiedCount =
    (analytics.data?.users.total ?? 0) - (analytics.data?.users.verified ?? 0);
  if (unverifiedCount > 0) {
    actionItems.push({
      label: "Akun belum terverifikasi",
      detail: `${unverifiedCount} akun belum lolos verifikasi.`,
      href: "/admin/verifikasi",
    });
  }

  if (analytics.error) {
    return <ErrorState message={analytics.error} onRetry={analytics.refetch} />;
  }

  return (
    <div className="space-y-10">
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

      <ActionNeeded items={actionItems} />

      <section className="panel p-5 sm:p-6" aria-label="Diagram status">
        <StatusDiagram
          analytics={analytics.data}
          loading={analytics.loading}
          error={analytics.error}
          onRetry={analytics.refetch}
        />
        {analytics.data ? (
          <div className="mt-4 flex justify-end border-t border-line pt-4">
            <ExportImpactButton analytics={analytics.data} />
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <section aria-labelledby="verification-queue-title" className="min-w-0">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
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
                    <li
                      key={verification.id}
                      className="p-4 transition-colors hover:bg-surface-soft sm:p-5"
                    >
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

        <aside className="panel h-fit p-5 sm:p-6" aria-labelledby="users-title">
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
          <div className="panel mt-4 divide-y divide-line">
            <div className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center sm:p-6">
              <div>
                <p className="font-bold">Listing</p>
                <p className="mt-1 text-sm text-muted">
                  {analytics.data.listings.byStatus.available ?? 0} tersedia ·{" "}
                  {analytics.data.listings.byStatus.completed ?? 0} selesai
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="display-soft text-2xl">
                  {analytics.data.listings.total}
                </span>
                <div className="meter flex-1">
                  <span
                    style={{
                      width: `${percent(
                        analytics.data.listings.byStatus.available ?? 0,
                        analytics.data.listings.total,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center sm:p-6">
              <div>
                <p className="font-bold">Reservasi</p>
                <p className="mt-1 text-sm text-muted">
                  {analytics.data.reservations.byStatus.pending ?? 0} menunggu ·{" "}
                  {analytics.data.reservations.byStatus.completed ?? 0} selesai
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="display-soft text-2xl">
                  {analytics.data.reservations.total}
                </span>
                <div className="meter flex-1">
                  <span
                    style={{
                      width: `${percent(
                        analytics.data.reservations.byStatus.completed ?? 0,
                        analytics.data.reservations.total,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center sm:p-6">
              <div>
                <p className="font-bold">Distribusi</p>
                <p className="mt-1 text-sm text-muted">
                  {analytics.data.distributions.byStatus.completed ?? 0} selesai ·{" "}
                  {analytics.data.distributions.byStatus.failed ?? 0} gagal
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="display-soft text-2xl">
                  {analytics.data.distributions.total}
                </span>
                <div className="meter flex-1">
                  <span
                    style={{
                      width: `${percent(
                        analytics.data.distributions.byStatus.completed ?? 0,
                        analytics.data.distributions.total,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center sm:p-6">
              <div>
                <p className="font-bold">Makanan tersalurkan</p>
                <p className="mt-1 text-sm text-muted">
                  {volumeText || "Belum ada distribusi yang selesai."}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="display-soft text-2xl">
                  {completedDistributions}
                </span>
                <div className="meter flex-1">
                  <span
                    style={{
                      width: `${percent(
                        completedDistributions,
                        analytics.data.distributions.total,
                      )}%`,
                    }}
                  />
                </div>
              </div>
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
