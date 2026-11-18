"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toDateTimeLocal } from "@/lib/format";
import { categoryLabels } from "@/lib/labels";
import type { FoodCategory, FoodUnit, Listing } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/auth/form-error";

const units: FoodUnit[] = ["porsi", "paket", "kg", "liter", "item"];

function defaultFuture(hours: number) {
  return toDateTimeLocal(new Date(Date.now() + hours * 60 * 60 * 1000).toISOString());
}

export function ListingEditor({
  listing,
  onSaved,
  onCancel,
}: {
  listing?: Listing;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const editing = Boolean(listing);

  const [name, setName] = useState(listing?.name ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [category, setCategory] = useState<FoodCategory>(
    listing?.category ?? "makanan_matang",
  );
  const [quantity, setQuantity] = useState(
    listing ? String(listing.quantity) : "10",
  );
  const [unit, setUnit] = useState<FoodUnit>(listing?.unit ?? "porsi");
  const [productionDate, setProductionDate] = useState(
    listing ? toDateTimeLocal(listing.productionDate) : toDateTimeLocal(new Date().toISOString()),
  );
  const [expiryDate, setExpiryDate] = useState(
    listing?.expiryDate ? toDateTimeLocal(listing.expiryDate) : "",
  );
  const [pickupDeadline, setPickupDeadline] = useState(
    listing ? toDateTimeLocal(listing.pickupDeadline) : defaultFuture(8),
  );
  const [allergens, setAllergens] = useState(
    listing?.allergens.join(", ") ?? "",
  );
  const [storageInstructions, setStorageInstructions] = useState(
    listing?.storageInstructions ?? "",
  );
  const [pickupAddress, setPickupAddress] = useState(
    listing?.pickupAddress ?? "",
  );
  const [latitude, setLatitude] = useState(
    listing?.location?.coordinates[1]?.toString() ?? "",
  );
  const [longitude, setLongitude] = useState(
    listing?.location?.coordinates[0]?.toString() ?? "",
  );
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const payload: Record<string, unknown> = {
      name,
      description,
      category,
      unit,
      productionDate: new Date(productionDate).toISOString(),
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      pickupDeadline: new Date(pickupDeadline).toISOString(),
      allergens: allergens
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      storageInstructions: storageInstructions.trim() || undefined,
      pickupAddress,
      location:
        latitude && longitude
          ? {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)],
            }
          : undefined,
    };

    if (!editing) {
      payload.quantity = Number(quantity);
    }

    try {
      const data = await apiFetch<{ listing: Listing }>(
        editing ? `/foods/${listing!.id}` : "/foods",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );

      if (editing) {
        onSaved?.();
      } else {
        router.push(`/provider/listing/${data.listing.id}`);
      }
    } catch (submitError) {
      setError(submitError);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <FormError error={error} />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Nama makanan" htmlFor="listing-name">
            <input
              id="listing-name"
              className="field-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field
            label="Deskripsi"
            htmlFor="listing-description"
            hint="Minimal 10 karakter. Sebutkan isi dan kondisi makanan."
          >
            <textarea
              id="listing-description"
              className="field-textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Kategori" htmlFor="listing-category">
          <select
            id="listing-category"
            className="field-select"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as FoodCategory)
            }
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <Field
            label="Jumlah"
            htmlFor="listing-quantity"
            hint={editing ? "Jumlah awal tidak dapat diubah." : undefined}
          >
            <input
              id="listing-quantity"
              type="number"
              min="0.01"
              step="0.01"
              className="field-input"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={editing}
              required={!editing}
            />
          </Field>
          <Field label="Satuan" htmlFor="listing-unit">
            <select
              id="listing-unit"
              className="field-select"
              value={unit}
              onChange={(event) => setUnit(event.target.value as FoodUnit)}
            >
              {units.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Waktu produksi" htmlFor="listing-production">
          <input
            id="listing-production"
            type="datetime-local"
            className="field-input"
            value={productionDate}
            onChange={(event) => setProductionDate(event.target.value)}
            required
          />
        </Field>
        <Field label="Tanggal kedaluwarsa" htmlFor="listing-expiry" optional>
          <input
            id="listing-expiry"
            type="datetime-local"
            className="field-input"
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
          />
        </Field>
        <Field
          label="Batas waktu pengambilan"
          htmlFor="listing-deadline"
          hint="Harus setelah waktu sekarang."
        >
          <input
            id="listing-deadline"
            type="datetime-local"
            className="field-input"
            value={pickupDeadline}
            onChange={(event) => setPickupDeadline(event.target.value)}
            required
          />
        </Field>
        <Field
          label="Alergen"
          htmlFor="listing-allergens"
          optional
          hint="Pisahkan dengan koma, contoh: kacang, susu."
        >
          <input
            id="listing-allergens"
            className="field-input"
            value={allergens}
            onChange={(event) => setAllergens(event.target.value)}
          />
        </Field>
        <div className="md:col-span-2">
          <Field
            label="Kondisi penyimpanan"
            htmlFor="listing-storage"
            optional
          >
            <input
              id="listing-storage"
              className="field-input"
              value={storageInstructions}
              onChange={(event) => setStorageInstructions(event.target.value)}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Alamat pengambilan" htmlFor="listing-address">
            <input
              id="listing-address"
              className="field-input"
              value={pickupAddress}
              onChange={(event) => setPickupAddress(event.target.value)}
              required
            />
          </Field>
        </div>
        <Field
          label="Latitude"
          htmlFor="listing-latitude"
          optional
          hint="Isi bersama longitude untuk menyimpan titik peta."
        >
          <input
            id="listing-latitude"
            type="number"
            step="any"
            className="field-input"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
          />
        </Field>
        <Field label="Longitude" htmlFor="listing-longitude" optional>
          <input
            id="listing-longitude"
            type="number"
            step="any"
            className="field-input"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <Button type="submit" loading={loading}>
          {editing ? "Simpan perubahan" : "Buat listing"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="quiet" onClick={onCancel}>
            Batal
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-muted">{errorMessage(error)}</p>
      ) : null}
    </form>
  );
}
