import type {
  Distribution,
  ListingSummary,
  Reservation,
  ReservationSummary,
  UserSummary,
} from "./types";

export function populatedListing(
  value: Reservation["listingId"] | Distribution["listingId"],
): ListingSummary | null {
  return typeof value === "string" ? null : value;
}

export function populatedUser(
  value: Reservation["providerId"] | Distribution["providerId"],
): UserSummary | null {
  return typeof value === "string" ? null : value;
}

export function populatedReservation(
  value: Distribution["reservationId"],
): ReservationSummary | null {
  return typeof value === "string" ? null : value;
}
