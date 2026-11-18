import mongoose from 'mongoose';

const { Schema } = mongoose;

const verificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    supportingDocumentUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: undefined,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

verificationSchema.index({ status: 1, createdAt: 1 });
verificationSchema.index({ userId: 1, createdAt: -1 });
verificationSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
    name: 'uniq_pending_verification_per_user',
  },
);

verificationSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
    return ret;
  },
});

export const Verification =
  mongoose.models.Verification ??
  mongoose.model('Verification', verificationSchema);
