"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useCurrentUser } from "@/components/auth/auth-provider";
import { ReservationForm } from "@/components/receiver/reservation-form";
import { FoodVisual } from "@/components/food-visual";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import {
  ErrorState,
  LoadingState,
  Notice,
} from "@/components/ui/states";
import {
  formatDateTime,
  formatDeadline,
  formatQuantity,
} from "@/lib/format";
import { categoryLabels, foodStatusLabels } from "@/lib/labels";
import { useApi } from "@/lib/use-api";
import type { Listing } from "@/lib/types";

export default function ReceiverFoodDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id);
  const { user } = useCurrentUser();
  const food = useApi<{ listing: Listing }>(`/foods/${id}`);
  const [created, setCreated] = useState(false);

  if (food.loading) return <LoadingState label="Memuat detail makanan..." />;
  if (food.error) {
    return <ErrorState message={food.error} onRetry={food.refetch} />;
  }
  if (!food.data || !user) return null;

  const listing = food.data.listing;
  const provider =
    typeof listing.providerId === "string" ? null : listing.providerId;
  const canReserve =
    listing.status === "available" && listing.availableQuantity > 0;

  return (
    <div className="space-y-7">
      <PageHeader
        kicker={categoryLabels[listing.category]}
        title={listing.name}
        description={`Dari ${provider?.organizationName ?? provider?.name ?? "penyedia"} · ${formatQuantity(listing.quantity, listing.unit)} dicatat`}
        actions={
          <Link href="/receiver/makanan" className="btn btn-secondary">
            Semua makanan
          </Link>
        }
      />

      {created ? (
        <Notice tone="success">
          Reservasi terkirim. Stok sudah dikurangi dan permintaan menunggu
          persetujuan penyedia.{" "}
          <Link href="/receiver/reservasi" className="link-underline">
            Lihat reservasi
          </Link>
          .
        </Notice>
      ) : null}

      <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="space-y-7">
          <FoodVisual category={listing.category} className="food-visual-lg" />
          <section className="panel p-5 sm:p-6" aria-labelledby="food-info">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge
                label={foodStatusLabels[listing.status]}
                status={listing.status}
              />
              <span className="text-sm text-muted">
                Batas ambil {formatDateTime(listing.pickupDeadline)} ·{" "}
                {formatDeadline(listing.pickupDeadline)}
              </span>
            </div>
            <h2 id="food-info" className="display mt-5 text-2xl">
              Catatan makanan
            </h2>
            <p className="mt-2 whitespace-pre-line text-base">
              {listing.description}
            </p>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="field-label">Tersedia</dt>
                <dd className="text-lg font-bold">
                  {formatQuantity(listing.availableQuantity, listing.unit)}
                </dd>
              </div>
              <div>
                <dt className="field-label">Waktu produksi</dt>
                <dd className="text-lg">
                  {formatDateTime(listing.productionDate)}
                </dd>
              </div>
              <div>
                <dt className="field-label">Kedaluwarsa</dt>
                <dd className="text-lg">{formatDateTime(listing.expiryDate)}</dd>
              </div>
              <div>
                <dt className="field-label">Alergen</dt>
                <dd className="text-lg">
                  {listing.allergens.length > 0
                    ? listing.allergens.join(", ")
                    : "Tidak dicatat"}
                </dd>
              </div>
              <div>
                <dt className="field-label">Penyimpanan</dt>
                <dd className="text-lg">
                  {listing.storageInstructions || "Tidak dicatat"}
                </dd>
              </div>
              <div>
                <dt className="field-label">Titik peta</dt>
                <dd className="text-lg">
                  {listing.location
                    ? `${listing.location.coordinates[1]}, ${listing.location.coordinates[0]}`
                    : "Tidak dicatat"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="field-label">Alamat pengambilan</dt>
                <dd className="text-lg">{listing.pickupAddress}</dd>
              </div>
            </dl>
          </section>

          <section className="panel p-5 sm:p-6" aria-labelledby="provider-info">
            <h2 id="provider-info" className="display text-2xl">
              Penyedia
            </h2>
            <p className="mt-2 text-lg font-bold">
              {provider?.organizationName ?? provider?.name ?? "Penyedia"}
            </p>
            {provider?.organizationName && provider.name ? (
              <p className="text-sm text-muted">Kontak: {provider.name}</p>
            ) : null}
            <p className="mt-3 text-sm text-muted">
              Koordinasi pengambilan dilakukan setelah reservasi disetujui.
              Periksa kondisi makanan saat bertemu.
            </p>
          </section>
        </article>

        <aside className="h-fit space-y-5 lg:sticky lg:top-24">
          <section className="panel p-5 sm:p-6" aria-labelledby="reserve-title">
            <p className="kicker">Reservasi</p>
            <h2 id="reserve-title" className="display mt-1 text-2xl">
              Ambil sebagian atau seluruhnya.
            </h2>

            <div className="divider my-5" />

            {created ? (
              <div className="space-y-4">
                <p className="text-sm text-muted">
                  Permintaan sudah dikirim. Anda tidak perlu mengirim ulang.
                </p>
                <Link href="/receiver/reservasi" className="btn btn-primary w-full">
                  Buka reservasi saya
                </Link>
              </div>
            ) : !canReserve ? (
              <p className="text-sm text-muted">
                Listing ini tidak lagi dapat direservasi. Statusnya{" "}
                {foodStatusLabels[listing.status].toLowerCase()} atau batas
                pengambilan sudah lewat.
              </p>
            ) : user.verificationStatus !== "verified" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted">
                  Akun penerima harus terverifikasi sebelum membuat reservasi.
                </p>
                <Link href="/verifikasi" className="btn btn-primary w-full">
                  Ajukan verifikasi
                </Link>
              </div>
            ) : (
              <ReservationForm
                listing={listing}
                onCreated={async () => {
                  setCreated(true);
                  await food.refetch();
                }}
              />
            )}
          </section>

          <Notice tone="info">
            Stok dikurangi saat permintaan dikirim. Jika ditolak atau
            dibatalkan, stok kembali ke listing secara otomatis.
          </Notice>
        </aside>
      </div>
    </div>
  );
}
