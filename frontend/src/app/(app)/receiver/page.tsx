"use client";

import Link from "next/link";
import { useMemo } from "react";
import { StatusDiagram } from "@/components/analytics/status-diagram";
import { ActionNeeded, type ActionItem } from "@/components/dashboard/action-needed";
import { ExportImpactButton } from "@/components/dashboard/export-impact-button";
import { PickupCalendar } from "@/components/dashboard/pickup-calendar";
import { useCurrentUser } from "@/components/auth/auth-provider";
import { FoodCard } from "@/components/food-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/use-api";
import { formatDateTime } from "@/lib/format";
import { reservationStatusLabels, unitLabels } from "@/lib/labels";
import { populatedListing } from "@/lib/relations";
import type {
  Distribution,
  Listing,
  Paginated,
  ReceiverAnalytics,
  Reservation,
} from "@/lib/types";

export default function ReceiverDashboardPage() {
  const { user } = useCurrentUser();
  const listings = useApi<Paginated<Listing>>("/foods?limit=4&page=1");
  const analytics = useApi<ReceiverAnalytics>("/analytics/receiver");
  const confirmed = useApi<Paginated<Distribution>>(
    "/distributions/history?status=verified&limit=3&page=1",
  );
  const upcoming = useApi<Paginated<Reservation>>(
    "/reservations/my?status=approved&limit=3&page=1",
  );
  const schedule = useApi<Paginated<Reservation>>(
    "/reservations/my?limit=50&page=1",
  );

  const availableCount = analytics.data?.reservations.byStatus.approved ?? 0;
  const totalCompleted =
    analytics.data?.completedQuantityByUnit.reduce(
      (total, item) => total + item.distributions,
      0,
    ) ?? 0;

  const nextPickup = useMemo(() => {
    const items = upcoming.data?.items ?? [];
    return [...items].sort((a, b) => {
      const left = a.pickupSchedule ? new Date(a.pickupSchedule).getTime() : Infinity;
      const right = b.pickupSchedule ? new Date(b.pickupSchedule).getTime() : Infinity;
      return left - right;
    })[0];
  }, [upcoming.data]);

  if (!user) return null;

  const actionItems: ActionItem[] = [];
  const confirmCount = confirmed.data?.items.length ?? 0;
  if (confirmCount > 0) {
    actionItems.push({
      label: "Konfirmasi penerimaan",
      detail: `${confirmCount} pengambilan sudah diverifikasi penyedia.`,
      href: "/receiver/distribusi",
    });
  }
  const waitingCount = analytics.data?.reservations.byStatus.pending ?? 0;
  if (waitingCount > 0) {
    actionItems.push({
      label: "Reservasi menunggu",
      detail: `${waitingCount} permintaan belum disetujui penyedia.`,
      href: "/receiver/reservasi?status=pending",
    });
  }
  if (user.verificationStatus !== "verified") {
    actionItems.push({
      label: "Ajukan verifikasi",
      detail: "Verifikasi diperlukan sebelum reservasi diterima.",
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
      href: `/receiver/reservasi?status=${item.status}`,
    }));

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Ringkasan penerima"
        title={`Makanan yang bisa diselamatkan hari ini.`}
        description="Stok yang tampil berasal dari listing penyedia terverifikasi dan masih dalam batas pengambilan. Reservasi mengurangi stok segera setelah dikirim."
        actions={
          <Link href="/receiver/makanan" className="btn btn-primary">
            Cari makanan
          </Link>
        }
      />

      {user.verificationStatus !== "verified" ? (
        <Notice tone="warning">
          Akun Anda belum terverifikasi, sehingga reservasi akan ditolak.{" "}
          <Link href="/verifikasi" className="link-underline">
            Ajukan verifikasi
          </Link>{" "}
          agar dapat menyelamatkan makanan.
        </Notice>
      ) : null}

      {confirmed.data && confirmed.data.items.length > 0 ? (
        <section className="panel border-warning p-5" aria-labelledby="confirm-title">
          <p className="kicker">Perlu konfirmasi</p>
          <h2 id="confirm-title" className="display mt-1 text-2xl">
            Pengambilan sudah diverifikasi.
          </h2>
          <p className="mt-2 text-sm text-muted">
            Konfirmasi bahwa makanan sudah Anda terima agar distribusi tercatat
            selesai dan masuk ringkasan dampak.
          </p>
          <Link href="/receiver/distribusi" className="btn btn-primary mt-4">
            Konfirmasi penyelesaian
          </Link>
        </section>
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
        <section aria-labelledby="nearby-title" className="min-w-0">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="kicker">Batas terdekat</p>
              <h2 id="nearby-title" className="display mt-1 text-2xl">
                Tersedia sekarang
              </h2>
            </div>
            <Link href="/receiver/makanan" className="link-underline text-sm">
              Lihat semua
            </Link>
          </div>

          <div className="mt-4">
            {listings.loading ? (
              <LoadingState label="Memuat makanan tersedia..." />
            ) : listings.error ? (
              <ErrorState message={listings.error} onRetry={listings.refetch} />
            ) : listings.data && listings.data.items.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {listings.data.items.map((listing) => (
                  <FoodCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Belum ada makanan tersedia."
                action={
                  <Button variant="secondary" onClick={listings.refetch}>
                    Muat ulang
                  </Button>
                }
              >
                Listing baru akan tampil di sini selama masih dalam batas
                pengambilan. Coba periksa lagi nanti.
              </EmptyState>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel p-5 sm:p-6" aria-labelledby="pickup-title">
            <p className="kicker">Jadwal</p>
            <h2 id="pickup-title" className="display mt-1 text-2xl">
              Pengambilan berikutnya
            </h2>
            {nextPickup ? (
              <div className="mt-4">
                <p className="font-bold">
                  {populatedListing(nextPickup.listingId)?.name ??
                    "Listing tidak tersedia"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatDateTime(nextPickup.pickupSchedule)}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Status: {reservationStatusLabels[nextPickup.status]}
                </p>
                <Link href="/receiver/reservasi" className="link-underline mt-4 inline-block text-sm">
                  Buka reservasi
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Belum ada pengambilan terjadwal. Reservasi yang disetujui akan
                muncul di sini.
              </p>
            )}
          </section>

          <section className="panel p-5 sm:p-6" aria-labelledby="impact-title">
            <p className="kicker">Dampak tercatat</p>
            <h2 id="impact-title" className="display mt-1 text-2xl">
              Yang sudah diterima
            </h2>
            {analytics.loading ? (
              <p className="mt-4 text-sm text-muted">Memuat angka...</p>
            ) : analytics.data &&
              analytics.data.completedQuantityByUnit.length > 0 ? (
              <div className="mt-4 space-y-4">
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
                  {totalCompleted} distribusi selesai tercatat.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Belum ada makanan yang selesai didistribusikan.
              </p>
            )}
          </section>

          <section className="panel p-5 sm:p-6">
            <p className="kicker">Reservasi aktif</p>
            <p className="display mt-1 text-3xl">{availableCount}</p>
            <p className="mt-1 text-sm text-muted">
              reservasi disetujui menunggu pengambilan.
            </p>
            {analytics.data ? (
              <p className="mt-3 text-sm text-muted">
                {analytics.data.reservations.byStatus.pending ?? 0} permintaan
                menunggu persetujuan.
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
