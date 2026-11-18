import mongoose from 'mongoose';
import { geoPointSchema } from '../../utils/geo-point-schema.js';
import {
  FOOD_CATEGORIES,
  FOOD_STATUSES,
  FOOD_UNITS,
} from './food.constants.js';

const { Schema } = mongoose;

const foodListingSchema = new Schema(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Nama makanan wajib diisi'],
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Deskripsi wajib diisi'],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: FOOD_CATEGORIES,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
      max: 100000,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
    },
    unit: {
      type: String,
      enum: FOOD_UNITS,
      required: true,
    },
    productionDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      default: undefined,
    },
    pickupDeadline: {
      type: Date,
      required: true,
    },
    allergens: {
      type: [String],
      default: [],
    },
    storageInstructions: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
    pickupAddress: {
      type: String,
      required: [true, 'Alamat pengambilan wajib diisi'],
      trim: true,
      maxlength: 300,
    },
    location: {
      type: geoPointSchema,
      default: undefined,
    },
    status: {
      type: String,
      enum: FOOD_STATUSES,
      default: 'available',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

foodListingSchema.index({ status: 1, pickupDeadline: 1 });
foodListingSchema.index({ status: 1, category: 1, pickupDeadline: 1 });
foodListingSchema.index({ providerId: 1, createdAt: -1 });

foodListingSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
    return ret;
  },
});

export const FoodListing =
  mongoose.models.FoodListing ??
  mongoose.model('FoodListing', foodListingSchema);
