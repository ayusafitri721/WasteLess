"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { withQuery } from "@/lib/api";
import { formatDateTime, formatDeadline, formatQuantity } from "@/lib/format";
import {
  categoryLabels,
  foodStatusLabels,
} from "@/lib/labels";
import { useApi } from "@/lib/use-api";
import type {
  FoodCategory,
  FoodStatus,
  Listing,
  Paginated,
} from "@/lib/types";

const statuses: FoodStatus[] = [
  "available",
  "reserved",
  "completed",
  "expired",
  "cancelled",
];

export default function ProviderListingsPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState<FoodCategory | "">("");
  const [status, setStatus] = useState<FoodStatus | "">("");
  const [page, setPage] = useState(1);

  const path = useMemo(
    () =>
      withQuery("/foods/mine", {
        q,
        category,
        status,
        page,
        limit: 10,
      }),
    [q, category, status, page],
  );
  const listings = useApi<Paginated<Listing>>(path);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQ(searchText.trim());
  }

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Listing"
        title="Makanan yang Anda catat."
        description="Hanya listing berstatus tersedia yang dapat diubah atau ditutup. Listing dengan reservasi aktif menunggu diselesaikan lebih dulu."
        actions={
          <Link href="/provider/listing/baru" className="btn btn-primary">
            Buat listing
          </Link>
        }
      />

      <section className="panel p-4 sm:p-5" aria-label="Filter listing">
        <form onSubmit={onSearch} className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div>
            <label className="field-label" htmlFor="listing-search">
              Cari nama atau deskripsi
            </label>
            <input
              id="listing-search"
              className="field-input"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Contoh: nasi box"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="listing-category">
              Kategori
            </label>
            <select
              id="listing-category"
              className="field-select"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as FoodCategory | "");
                setPage(1);
              }}
            >
              <option value="">Semua kategori</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="listing-status">
              Status
            </label>
            <select
              id="listing-status"
              className="field-select"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as FoodStatus | "");
                setPage(1);
              }}
            >
              <option value="">Semua status</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {foodStatusLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="secondary" className="w-full md:w-auto">
              Cari
            </Button>
          </div>
        </form>
      </section>

      {listings.loading ? (
        <LoadingState label="Memuat listing Anda..." />
      ) : listings.error ? (
        <ErrorState message={listings.error} onRetry={listings.refetch} />
      ) : listings.data && listings.data.items.length > 0 ? (
        <div className="space-y-4">
          <ul className="panel data-list overflow-hidden">
            {listings.data.items.map((listing) => (
              <li key={listing.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="display text-xl">{listing.name}</h2>
                      <StatusBadge
                        label={foodStatusLabels[listing.status]}
                        status={listing.status}
                      />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {categoryLabels[listing.category]} ·{" "}
                      {formatQuantity(listing.availableQuantity, listing.unit)} dari{" "}
                      {formatQuantity(listing.quantity, listing.unit)} tersedia
                    </p>
                    <p className="mt-1 text-sm">
                      Batas ambil {formatDateTime(listing.pickupDeadline)}{" "}
                      <span className="text-brand">
                        ({formatDeadline(listing.pickupDeadline)})
                      </span>
                    </p>
                  </div>
                  <Link
                    href={`/provider/listing/${listing.id}`}
                    className="btn btn-secondary"
                  >
                    Buka listing
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <Pagination pagination={listings.data.pagination} onPage={setPage} />
        </div>
      ) : (
        <EmptyState
          title={q || category || status ? "Tidak ada listing yang cocok." : "Belum ada listing."}
          action={
            <Button onClick={() => router.push("/provider/listing/baru")}>
              Buat listing pertama
            </Button>
          }
        >
          {q || category || status
            ? "Ubah kata kunci atau filter untuk melihat listing lain."
            : "Listing yang Anda buat akan tampil untuk penerima terverifikasi selama statusnya tersedia."}
        </EmptyState>
      )}
    </div>
  );
}
