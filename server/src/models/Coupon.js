const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount cannot be negative'],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUses: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Check if a coupon is valid right now.
 * Returns { valid: boolean, reason?: string }
 */
couponSchema.methods.checkValidity = function (orderAmount) {
  const now = new Date();

  if (!this.isActive) {
    return { valid: false, reason: 'Coupon is no longer active' };
  }
  if (now < this.validFrom) {
    return { valid: false, reason: 'Coupon is not yet valid' };
  }
  if (now > this.validUntil) {
    return { valid: false, reason: 'Coupon has expired' };
  }
  if (this.maxUses !== null && this.usedCount >= this.maxUses) {
    return { valid: false, reason: 'Coupon usage limit reached' };
  }
  if (orderAmount < this.minOrderAmount) {
    return {
      valid: false,
      reason: `Minimum order amount is ${this.minOrderAmount}`,
    };
  }

  return { valid: true };
};

/**
 * Calculate the discount amount for a given order subtotal.
 */
couponSchema.methods.calculateDiscount = function (subtotal) {
  if (this.discountType === 'percentage') {
    return Math.round((subtotal * this.discountValue) / 100 * 100) / 100;
  }
  // fixed: can't discount more than the subtotal
  return Math.min(this.discountValue, subtotal);
};

module.exports = mongoose.model('Coupon', couponSchema);
