import mongoose from 'mongoose';
import { FOOD_UNITS } from '../foods/food.constants.js';
import { DISTRIBUTION_STATUSES } from './distribution.constants.js';

const { Schema } = mongoose;

const distributionSchema = new Schema(
  {
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
      unique: true,
    },
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
    unit: {
      type: String,
      enum: FOOD_UNITS,
      required: true,
    },
    pickupVerificationHash: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      enum: DISTRIBUTION_STATUSES,
      default: 'pickup_ready',
    },
    verifiedAt: {
      type: Date,
      default: undefined,
    },
    completedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

distributionSchema.index({ providerId: 1, createdAt: -1 });
distributionSchema.index({ receiverId: 1, createdAt: -1 });
distributionSchema.index({ status: 1, createdAt: 1 });

distributionSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
    delete ret.pickupVerificationHash;
    return ret;
  },
});

export const Distribution =
  mongoose.models.Distribution ??
  mongoose.model('Distribution', distributionSchema);
