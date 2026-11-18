import { statusTone } from "@/lib/labels";
import type {
  DistributionStatus,
  FoodStatus,
  ReservationStatus,
} from "@/lib/types";

export function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: FoodStatus | ReservationStatus | DistributionStatus;
}) {
  const tone = statusTone(status);
  return (
    <span className={`status status-${tone}`}>
      {label}
    </span>
  );
}
