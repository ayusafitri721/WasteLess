import Link from "next/link";
import { formatDateTime, formatDeadline, formatQuantity } from "@/lib/format";
import { categoryLabels, foodStatusLabels } from "@/lib/labels";
import type { Listing } from "@/lib/types";
import { FoodVisual } from "./food-visual";
import { Icon } from "./ui/icons";
import { StatusBadge } from "./ui/status-badge";

export function FoodCard({ listing }: { listing: Listing }) {
  const provider =
    typeof listing.providerId === "string" ? null : listing.providerId;

  return (
    <Link
      href={`/receiver/makanan/${listing.id}`}
      className="food-card group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      <div className="food-card-media">
        <FoodVisual category={listing.category} />
        <div className="absolute left-3 top-3 z-10">
          <StatusBadge
            label={foodStatusLabels[listing.status]}
            status={listing.status}
          />
        </div>
      </div>

      <div className="food-card-body">
        <p className="kicker">{categoryLabels[listing.category]}</p>
        <h2 className="display mt-1 text-xl group-hover:text-brand">
          {listing.name}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {provider?.organizationName ?? provider?.name ?? "Penyedia"}
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <Icon
              name="clock"
              size={17}
              className="mt-0.5 shrink-0 text-brand"
            />
            <span>
              <span className="text-muted">Batas ambil </span>
              <span className="font-bold">
                {formatDateTime(listing.pickupDeadline)}
              </span>
              <span className="block text-xs text-brand">
                {formatDeadline(listing.pickupDeadline)}
              </span>
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Icon
              name="mapPin"
              size={17}
              className="mt-0.5 shrink-0 text-brand"
            />
            <span className="line-clamp-2 text-muted">
              {listing.pickupAddress}
            </span>
          </p>
        </div>

        <div className="food-card-footer mt-auto">
          <span className="text-sm font-bold">
            {formatQuantity(listing.availableQuantity, listing.unit)} tersedia
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-brand">
            Detail
            <Icon name="arrowRight" size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
