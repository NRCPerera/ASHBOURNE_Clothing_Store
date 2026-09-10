const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantSku: {
      type: String,
      required: [true, 'Variant SKU is required'],
      uppercase: true,
    },
    delta: {
      type: Number,
      required: [true, 'Delta is required'], // positive = added, negative = removed
    },
    reason: {
      type: String,
      enum: ['sale', 'restock', 'admin_correction', 'return'],
      required: [true, 'Reason is required'],
    },
    resultingStock: {
      type: Number,
      required: true,
      min: 0,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system/webhook actions
    },
    note: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ───
stockMovementSchema.index({ product: 1, variantSku: 1, createdAt: -1 });
stockMovementSchema.index({ reason: 1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
