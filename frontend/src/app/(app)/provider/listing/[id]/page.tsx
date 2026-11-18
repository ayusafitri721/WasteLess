"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ListingEditor } from "@/components/provider/listing-editor";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ErrorState,
  LoadingState,
  Notice,
} from "@/components/ui/states";
import { apiFetch } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import {
  formatDateTime,
  formatDeadline,
  formatQuantity,
} from "@/lib/format";
import { categoryLabels, foodStatusLabels } from "@/lib/labels";
import { useApi } from "@/lib/use-api";
import type { Listing } from "@/lib/types";

export default function ProviderListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id);
  const listing = useApi<{ listing: Listing }>(`/foods/${id}`);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState<unknown>(null);
  const [cancelling, setCancelling] = useState(false);

  if (listing.loading) return <LoadingState label="Memuat listing..." />;
  if (listing.error) {
    return <ErrorState message={listing.error} onRetry={listing.refetch} />;
  }
  if (!listing.data) return null;

  const data = listing.data.listing;
  const canEdit = data.status === "available";

  async function cancelListing() {
    setCancelError(null);
    setCancelling(true);
    try {
      await apiFetch<{ listing: Listing }>(`/foods/${id}`, {
        method: "DELETE",
      });
      setCancelOpen(false);
      setSaved(false);
      await listing.refetch();
    } catch (error) {
      setCancelError(error);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        kicker={categoryLabels[data.category]}
        title={data.name}
        description={`Dibuat ${formatDateTime(data.createdAt)} · Diperbarui ${formatDateTime(data.updatedAt)}`}
        actions={
          <>
            <Link href="/provider/listing" className="btn btn-secondary">
              Semua listing
            </Link>
            {canEdit ? (
              <Button
                variant="primary"
                onClick={() => {
                  setEditing((value) => !value);
                  setSaved(false);
                }}
              >
                {editing ? "Tutup editor" : "Ubah listing"}
              </Button>
            ) : null}
          </>
        }
      />

      {saved ? <Notice tone="success">Perubahan listing tersimpan.</Notice> : null}

      <section className="panel p-5 sm:p-6" aria-labelledby="listing-summary">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge
            label={foodStatusLabels[data.status]}
            status={data.status}
          />
          <span className="text-sm text-muted">
            Batas ambil {formatDateTime(data.pickupDeadline)} ·{" "}
            {formatDeadline(data.pickupDeadline)}
          </span>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="field-label">Jumlah awal</p>
            <p className="text-lg font-bold">
              {formatQuantity(data.quantity, data.unit)}
            </p>
          </div>
          <div>
            <p className="field-label">Masih tersedia</p>
            <p className="text-lg font-bold">
              {formatQuantity(data.availableQuantity, data.unit)}
            </p>
          </div>
          <div>
            <p className="field-label">Kedaluwarsa</p>
            <p className="text-lg">{formatDateTime(data.expiryDate)}</p>
          </div>
          <div>
            <p className="field-label">Produksi</p>
            <p className="text-lg">{formatDateTime(data.productionDate)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="field-label">Alamat pengambilan</p>
            <p className="text-lg">{data.pickupAddress}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="field-label">Deskripsi</p>
            <p className="max-w-3xl whitespace-pre-line text-base">
              {data.description}
            </p>
          </div>
          <div>
            <p className="field-label">Alergen</p>
            <p className="text-base">
              {data.allergens.length > 0 ? data.allergens.join(", ") : "Tidak dicatat"}
            </p>
          </div>
          <div>
            <p className="field-label">Penyimpanan</p>
            <p className="text-base">
              {data.storageInstructions || "Tidak dicatat"}
            </p>
          </div>
          <div>
            <p className="field-label">Titik peta</p>
            <p className="text-base">
              {data.location
                ? `${data.location.coordinates[1]}, ${data.location.coordinates[0]}`
                : "Tidak dicatat"}
            </p>
          </div>
        </div>

        {canEdit ? (
          <div className="mt-7 flex flex-wrap gap-3 border-t border-line pt-5">
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              Tutup listing
            </Button>
            <p className="max-w-xl text-sm text-muted">
              Menutup listing yang masih tersedia akan mengubah statusnya
              menjadi dibatalkan. Listing dengan reservasi aktif tidak dapat
              ditutup.
            </p>
          </div>
        ) : (
          <p className="mt-7 border-t border-line pt-5 text-sm text-muted">
            Listing berstatus {foodStatusLabels[data.status].toLowerCase()}.
            Hanya listing tersedia yang dapat diubah atau ditutup.
          </p>
        )}
      </section>

      {editing && canEdit ? (
        <section className="panel p-5 sm:p-7" aria-labelledby="edit-title">
          <h2 id="edit-title" className="display mb-5 text-2xl">
            Ubah listing
          </h2>
          <ListingEditor
            listing={data}
            onCancel={() => setEditing(false)}
            onSaved={async () => {
              setEditing(false);
              setSaved(true);
              await listing.refetch();
            }}
          />
        </section>
      ) : null}

      <Dialog
        open={cancelOpen}
        title="Tutup listing ini?"
        onClose={() => {
          if (!cancelling) setCancelOpen(false);
        }}
      >
        <p className="text-sm text-muted">
          Listing tidak akan tampil lagi untuk penerima. Tindakan ini tidak
          menghapus riwayat.
        </p>
        {cancelError ? (
          <div className="mt-4">
            <Notice tone="danger">{errorMessage(cancelError)}</Notice>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="danger" loading={cancelling} onClick={cancelListing}>
            Ya, tutup listing
          </Button>
          <Button
            variant="quiet"
            onClick={() => setCancelOpen(false)}
            disabled={cancelling}
          >
            Batal
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
