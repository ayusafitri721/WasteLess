import { Icon, type IconName } from "./ui/icons";
import type { FoodCategory } from "@/lib/types";

const categoryIcons: Record<FoodCategory, IconName> = {
  makanan_matang: "bowl",
  roti_dan_kue: "bread",
  buah_dan_sayur: "leaf",
  makanan_kemasan: "package",
  minuman: "cup",
  lainnya: "grid",
};

export function FoodVisual({
  category,
  className = "",
}: {
  category: FoodCategory;
  className?: string;
}) {
  return (
    <div className={`food-visual ${className}`} aria-hidden="true">
      <Icon name={categoryIcons[category]} size={46} strokeWidth={1.5} />
    </div>
  );
}
