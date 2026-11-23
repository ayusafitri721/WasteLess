import mongoose from 'mongoose';
import { geoPointSchema } from '../../utils/geo-point-schema.js';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama wajib diisi'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email wajib diisi'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['provider', 'receiver', 'admin'],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: undefined,
    },
    organizationName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: undefined,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      default: undefined,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
      default: undefined,
    },
    location: {
      type: geoPointSchema,
      default: undefined,
    },
    oauthAccounts: {
      type: [
        {
          provider: {
            type: String,
            enum: ['google', 'github'],
            required: true,
          },
          providerAccountId: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
    delete ret.passwordHash;
    delete ret.tokenVersion;
    delete ret.passwordResetTokenHash;
    delete ret.passwordResetExpiresAt;
    return ret;
  },
});

export const User =
  mongoose.models.User ?? mongoose.model('User', userSchema);
