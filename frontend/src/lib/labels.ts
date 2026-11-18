import type {
  DistributionStatus,
  FoodCategory,
  FoodStatus,
  FoodUnit,
  ReservationStatus,
  Role,
  VerificationStatus,
} from "./types";

export const roleLabels: Record<Role, string> = {
  provider: "Penyedia",
  receiver: "Penerima",
  admin: "Admin",
};

export const verificationLabels: Record<VerificationStatus, string> = {
  unverified: "Belum diverifikasi",
  pending: "Menunggu verifikasi",
  verified: "Terverifikasi",
  rejected: "Verifikasi ditolak",
};

export const categoryLabels: Record<FoodCategory, string> = {
  makanan_matang: "Makanan matang",
  roti_dan_kue: "Roti dan kue",
  buah_dan_sayur: "Buah dan sayur",
  makanan_kemasan: "Makanan kemasan",
  minuman: "Minuman",
  lainnya: "Lainnya",
};

export const unitLabels: Record<FoodUnit, string> = {
  porsi: "porsi",
  paket: "paket",
  kg: "kg",
  liter: "liter",
  item: "item",
};

export const foodStatusLabels: Record<FoodStatus, string> = {
  draft: "Draf",
  available: "Tersedia",
  reserved: "Direservasi",
  completed: "Selesai",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan",
};

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  pending: "Menunggu persetujuan",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  ready_for_pickup: "Siap diambil",
  picked_up: "Sudah diambil",
  completed: "Selesai",
  expired: "Kedaluwarsa",
};

export const distributionStatusLabels: Record<DistributionStatus, string> = {
  pending: "Menunggu",
  pickup_ready: "Siap diambil",
  verified: "Pengambilan terverifikasi",
  completed: "Selesai",
  failed: "Gagal",
};

export function statusTone(
  status: FoodStatus | ReservationStatus | DistributionStatus,
): "neutral" | "success" | "warning" | "danger" | "info" {
  if (
    ["available", "approved", "ready_for_pickup", "verified", "completed"].includes(
      status,
    )
  ) {
    return "success";
  }
  if (["pending", "reserved", "pickup_ready", "picked_up", "draft"].includes(status)) {
    return "warning";
  }
  if (["rejected", "cancelled", "expired", "failed"].includes(status)) {
    return "danger";
  }
  return "neutral";
}
