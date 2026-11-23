import mongoose from 'mongoose';

const { Schema } = mongoose;

const oauthExchangeSchema = new Schema(
  {
    codeHash: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

oauthExchangeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OAuthExchange =
  mongoose.models.OAuthExchange ??
  mongoose.model('OAuthExchange', oauthExchangeSchema);
