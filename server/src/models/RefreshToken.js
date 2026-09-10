const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdByIp: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// ─── TTL index: MongoDB automatically deletes expired tokens ───
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── Index for fast lookup by user (used during logout-all) ───
refreshTokenSchema.index({ user: 1 });

/**
 * Hash a raw refresh token before storing.
 * We store only the hash so that a DB leak doesn't expose usable tokens.
 */
refreshTokenSchema.statics.hashToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
