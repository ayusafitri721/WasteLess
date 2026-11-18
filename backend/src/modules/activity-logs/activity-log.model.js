import mongoose from 'mongoose';

const { Schema } = mongoose;

const activityLogSchema = new Schema(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

activityLogSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
    return ret;
  },
});

export const ActivityLog =
  mongoose.models.ActivityLog ??
  mongoose.model('ActivityLog', activityLogSchema);
