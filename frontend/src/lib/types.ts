export type Role = "provider" | "receiver" | "admin";
export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";
export type FoodCategory =
  | "makanan_matang"
  | "roti_dan_kue"
  | "buah_dan_sayur"
  | "makanan_kemasan"
  | "minuman"
  | "lainnya";
export type FoodUnit = "porsi" | "paket" | "kg" | "liter" | "item";
export type FoodStatus =
  | "draft"
  | "available"
  | "reserved"
  | "completed"
  | "expired"
  | "cancelled";
export type ReservationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "ready_for_pickup"
  | "picked_up"
  | "completed"
  | "expired";
export type DistributionStatus =
  | "pending"
  | "pickup_ready"
  | "verified"
  | "completed"
  | "failed";

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  organizationName?: string;
  verificationStatus: VerificationStatus;
  location?: GeoPoint;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  organizationName?: string;
  phone?: string;
}

export interface ProviderSummary {
  id: string;
  name: string;
  organizationName?: string;
  verificationStatus: VerificationStatus;
}

export interface Listing {
  id: string;
  providerId: string | ProviderSummary;
  name: string;
  description: string;
  category: FoodCategory;
  quantity: number;
  availableQuantity: number;
  unit: FoodUnit;
  productionDate: string;
  expiryDate?: string;
  pickupDeadline: string;
  allergens: string[];
  storageInstructions?: string;
  pickupAddress: string;
  location?: GeoPoint;
  status: FoodStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListingSummary {
  id: string;
  name: string;
  category: FoodCategory;
  unit: FoodUnit;
  pickupDeadline: string;
  pickupAddress: string;
  status: FoodStatus;
  availableQuantity: number;
}

export interface Reservation {
  id: string;
  listingId: string | ListingSummary;
  providerId: string | UserSummary;
  receiverId: string | UserSummary;
  quantity: number;
  status: ReservationStatus;
  pickupSchedule?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  statusNote?: string;
  statusChangedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationSummary {
  id: string;
  status: ReservationStatus;
  quantity: number;
  pickupSchedule?: string;
  approvedAt?: string;
}

export interface Distribution {
  id: string;
  reservationId: string | ReservationSummary;
  listingId: string | ListingSummary;
  providerId: string | UserSummary;
  receiverId: string | UserSummary;
  quantity: number;
  unit: FoodUnit;
  status: DistributionStatus;
  verifiedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Verification {
  id: string;
  userId: string | UserSummary & { email: string; role: Role; verificationStatus: VerificationStatus };
  organizationName: string;
  contactPhone: string;
  supportingDocumentUrl?: string;
  notes?: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string | null;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface StatusBreakdown {
  total: number;
  byStatus: Record<string, number>;
}

export interface UnitQuantity {
  unit: FoodUnit;
  quantity: number;
  distributions: number;
}

export interface ProviderAnalytics {
  listings: StatusBreakdown;
  reservations: StatusBreakdown;
  distributions: StatusBreakdown;
  completedQuantityByUnit: UnitQuantity[];
}

export interface ReceiverAnalytics {
  reservations: StatusBreakdown;
  distributions: StatusBreakdown;
  completedQuantityByUnit: UnitQuantity[];
}

export interface PlatformAnalytics {
  users: {
    total: number;
    verified: number;
    byRole: Record<Role, number>;
  };
  listings: StatusBreakdown;
  reservations: StatusBreakdown;
  distributions: StatusBreakdown;
  completedQuantityByUnit: UnitQuantity[];
}

export interface ReadyForPickupResult {
  reservation: Reservation;
  distribution: Distribution;
  pickupCode: string;
}
