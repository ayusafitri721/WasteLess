"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useCurrentUser } from "@/components/auth/auth-provider";
import { FoodCard } from "@/components/food-card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from "@/components/ui/states";
import { withQuery } from "@/lib/api";
import { categoryLabels } from "@/lib/labels";
import { useApi } from "@/lib/use-api";
import Link from "next/link";
import type { FoodCategory, Listing, Paginated } from "@/lib/types";

export default function ReceiverFoodsPage() {
  const { user } = useCurrentUser();
  const [searchText, setSearchText] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<FoodCategory | "">("");
  const [page, setPage] = useState(1);

  const path = useMemo(
    () => withQuery("/foods", { q, category, page, limit: 12 }),
    [q, category, page],
  );
  const foods = useApi<Paginated<Listing>>(path);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQ(searchText.trim());
  }

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Cari makanan"
        title="Ambil yang masih layak, tepat waktu."
        description="Urutan dimulai dari batas pengambilan terdekat. Periksa alergen, alamat, dan jadwal sebelum reservasi."
      />

      {user && user.verificationStatus !== "verified" ? (
        <Notice tone="warning">
          Anda dapat melihat listing, tetapi reservasi memerlukan verifikasi.{" "}
          <Link href="/verifikasi" className="link-underline">
            Ajukan verifikasi
          </Link>
          .
        </Notice>
      ) : null}

      <section className="panel p-4 sm:p-5" aria-label="Filter makanan">
        <form onSubmit={onSearch} className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div>
            <label className="field-label" htmlFor="food-search">
              Cari nama atau deskripsi
            </label>
            <input
              id="food-search"
              className="field-input"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Contoh: sayur, roti, nasi"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="food-category">
              Kategori
            </label>
            <select
              id="food-category"
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
          <div className="flex items-end">
            <Button type="submit" variant="secondary" className="w-full md:w-auto">
              Cari
            </Button>
          </div>
        </form>
      </section>

      {foods.loading ? (
        <LoadingState label="Memuat makanan tersedia..." />
      ) : foods.error ? (
        <ErrorState message={foods.error} onRetry={foods.refetch} />
      ) : foods.data && foods.data.items.length > 0 ? (
        <div className="space-y-5">
          <p className="text-sm text-muted" aria-live="polite">
            {foods.data.pagination.total} listing tersedia
            {q ? ` untuk “${q}”` : ""}.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {foods.data.items.map((listing) => (
              <FoodCard key={listing.id} listing={listing} />
            ))}
          </div>
          <Pagination pagination={foods.data.pagination} onPage={setPage} />
        </div>
      ) : (
        <EmptyState
          title={
            q || category
              ? "Tidak ada makanan yang cocok."
              : "Belum ada makanan tersedia."
          }
          action={
            <Button variant="secondary" onClick={foods.refetch}>
              Muat ulang
            </Button>
          }
        >
          {q || category
            ? "Coba kata kunci atau kategori lain, atau hapus filter."
            : "Listing penyedia akan muncul selama stok tersedia dan batas pengambilan belum lewat."}
        </EmptyState>
      )}
    </div>
  );
}
