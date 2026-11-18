import mongoose from 'mongoose';
import { RESERVATION_STATUSES } from './reservation.constants.js';

const { Schema } = mongoose;

const reservationSchema = new Schema(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'FoodListing',
      required: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
      max: 100000,
    },
    status: {
      type: String,
      enum: RESERVATION_STATUSES,
      default: 'pending',
    },
    pickupSchedule: {
      type: Date,
      default: undefined,
    },
    approvedAt: {
      type: Date,
      default: undefined,
    },
    rejectedAt: {
      type: Date,
      default: undefined,
    },
    cancelledAt: {
      type: Date,
      default: undefined,
    },
    statusNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
    statusChangedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reservationSchema.index({ receiverId: 1, createdAt: -1 });
reservationSchema.index({ providerId: 1, createdAt: -1 });
reservationSchema.index({ listingId: 1, status: 1 });
reservationSchema.index({ status: 1, createdAt: 1 });

reservationSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
    return ret;
  },
});

export const Reservation =
  mongoose.models.Reservation ??
  mongoose.model('Reservation', reservationSchema);
