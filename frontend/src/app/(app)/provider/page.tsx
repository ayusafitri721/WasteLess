"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { StatusDiagram } from "@/components/analytics/status-diagram";
import { ActionNeeded, type ActionItem } from "@/components/dashboard/action-needed";
import { ExportImpactButton } from "@/components/dashboard/export-impact-button";
import { PickupCalendar } from "@/components/dashboard/pickup-calendar";
import { useCurrentUser } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState, Notice } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useApi } from "@/lib/use-api";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { reservationStatusLabels, unitLabels } from "@/lib/labels";
import { populatedListing, populatedUser } from "@/lib/relations";
import type {
  Paginated,
  ProviderAnalytics,
  Reservation,
} from "@/lib/types";

export default function ProviderDashboardPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const analytics = useApi<ProviderAnalytics>("/analytics/provider");
  const pending = useApi<Paginated<Reservation>>(
    "/reservations/my?status=pending&limit=5&page=1",
  );
  const schedule = useApi<Paginated<Reservation>>(
    "/reservations/my?limit=50&page=1",
  );

  const impactTotal = useMemo(
    () =>
      analytics.data?.completedQuantityByUnit.reduce(
        (total, item) => total + item.distributions,
        0,
      ) ?? 0,
    [analytics.data],
  );

  if (!user) return null;

  const actionItems: ActionItem[] = [];
  const pendingCount = pending.data?.pagination.total ?? 0;
  if (pendingCount > 0) {
    actionItems.push({
      label: "Tinjau reservasi",
      detail: `${pendingCount} permintaan menunggu keputusan.`,
      href: "/provider/reservasi?status=pending",
    });
  }
  const readyCount = analytics.data?.reservations.byStatus.ready_for_pickup ?? 0;
  if (readyCount > 0) {
    actionItems.push({
      label: "Periksa kode ambil",
      detail: `${readyCount} reservasi siap diambil.`,
      href: "/provider/distribusi",
    });
  }
  if (user.verificationStatus !== "verified") {
    actionItems.push({
      label: "Ajukan verifikasi",
      detail: "Verifikasi diperlukan sebelum listing dapat dibuat.",
      href: "/verifikasi",
    });
  }

  const calendarEvents = (schedule.data?.items ?? [])
    .filter((item) => item.pickupSchedule)
    .map((item) => ({
      id: item.id,
      listingName: populatedListing(item.listingId)?.name ?? "Listing",
      schedule: item.pickupSchedule as string,
      statusLabel: reservationStatusLabels[item.status],
      href: `/provider/reservasi?status=${item.status}`,
    }));

  if (analytics.error) {
    return (
      <ErrorState message={analytics.error} onRetry={analytics.refetch} />
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Ringkasan penyedia"
        title={`Selamat bekerja, ${user.name.split(" ")[0]}.`}
        description="Antrean reservasi yang menunggu keputusan ada di depan. Angka dampak dihitung dari distribusi yang sudah selesai."
        actions={
          <Button
            variant="primary"
            onClick={() => router.push("/provider/listing/baru")}
          >
            Buat listing
          </Button>
        }
      />

      {user.verificationStatus !== "verified" ? (
        <Notice tone="warning">
          Akun Anda berstatus belum terverifikasi.{" "}
          <Link href="/verifikasi" className="link-underline">
            Ajukan verifikasi
          </Link>{" "}
          sebelum membuat listing agar permintaan tidak ditolak backend.
        </Notice>
      ) : null}

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

      <PickupCalendar events={calendarEvents} loading={schedule.loading} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <section aria-labelledby="queue-title" className="min-w-0">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="kicker">Perlu keputusan</p>
              <h2 id="queue-title" className="display mt-1 text-2xl">
                Reservasi menunggu
              </h2>
            </div>
            <Link href="/provider/reservasi" className="link-underline text-sm">
              Lihat semua
            </Link>
          </div>

          <div className="mt-4">
            {pending.loading ? (
              <LoadingState label="Memuat reservasi yang menunggu..." />
            ) : pending.error ? (
              <ErrorState message={pending.error} onRetry={pending.refetch} />
            ) : pending.data && pending.data.items.length > 0 ? (
              <ul className="panel data-list overflow-hidden">
                {pending.data.items.map((reservation) => {
                  const listing = populatedListing(reservation.listingId);
                  const receiver = populatedUser(reservation.receiverId);
                  return (
                    <li
                      key={reservation.id}
                      className="p-4 transition-colors hover:bg-surface-soft sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold">
                            {listing?.name ?? "Listing tidak tersedia"}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {receiver?.organizationName ?? receiver?.name ?? "Penerima"}{" "}
                            meminta {formatQuantity(reservation.quantity, listing?.unit ?? "")}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Diajukan {formatDateTime(reservation.createdAt)}
                          </p>
                        </div>
                        <StatusBadge
                          label={reservationStatusLabels[reservation.status]}
                          status={reservation.status}
                        />
                      </div>
                      <Link
                        href="/provider/reservasi"
                        className="btn btn-secondary mt-4 w-full sm:w-auto"
                      >
                        Tinjau permintaan
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                title="Tidak ada reservasi menunggu."
                action={
                  <Link href="/provider/listing" className="btn btn-secondary">
                    Periksa listing aktif
                  </Link>
                }
              >
                Saat penerima mengajukan makanan dari listing Anda, permintaan
                akan muncul di sini untuk disetujui atau ditolak.
              </EmptyState>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel p-5 sm:p-6" aria-labelledby="impact-title">
            <p className="kicker">Dampak tercatat</p>
            <h2 id="impact-title" className="display mt-1 text-2xl">
              Yang sudah tersalurkan
            </h2>
            {analytics.loading ? (
              <p className="mt-4 text-sm text-muted">Memuat angka...</p>
            ) : analytics.data && analytics.data.completedQuantityByUnit.length > 0 ? (
              <div className="mt-5 space-y-4">
                {analytics.data.completedQuantityByUnit.map((item) => (
                  <div key={item.unit}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-muted">
                        {unitLabels[item.unit]}
                      </span>
                      <span className="display text-2xl">
                        {new Intl.NumberFormat("id-ID", {
                          maximumFractionDigits: 2,
                        }).format(item.quantity)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Dari {item.distributions} distribusi selesai
                    </p>
                  </div>
                ))}
                <p className="border-t border-line pt-3 text-xs text-muted">
                  Total {impactTotal} distribusi selesai tercatat.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Belum ada distribusi yang selesai. Angka akan muncul setelah
                penerima mengonfirmasi serah terima.
              </p>
            )}
          </section>

          <section className="panel p-5 sm:p-6" aria-labelledby="listing-summary-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker">Listing</p>
                <h2 id="listing-summary-title" className="display mt-1 text-2xl">
                  Stok yang tampil
                </h2>
              </div>
              <Link href="/provider/listing" className="link-underline text-sm">
                Kelola
              </Link>
            </div>
            {analytics.data ? (
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Tersedia</dt>
                  <dd className="font-bold">
                    {analytics.data.listings.byStatus.available ?? 0}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Direservasi</dt>
                  <dd className="font-bold">
                    {analytics.data.listings.byStatus.reserved ?? 0}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Selesai</dt>
                  <dd className="font-bold">
                    {analytics.data.listings.byStatus.completed ?? 0}
                  </dd>
                </div>
              </dl>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
