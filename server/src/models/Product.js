const mongoose = require('mongoose');

// ─── Embedded variant sub-schema ───
const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: [true, 'Variant size is required'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Variant color is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    priceOverride: {
      type: Number,
      min: [0, 'Price override cannot be negative'],
      default: null, // null = use product.basePrice
    },
  },
  {
    _id: false, // embedded, no separate _id
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    brand: {
      type: String,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    images: [
      {
        type: String, // Cloudinary/S3 URLs
      },
    ],
    variants: {
      type: [variantSchema],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'Product must have at least one variant',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ─── Aggregated review data ───
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ───
productSchema.index({ category: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ 'variants.sku': 1 }, { unique: true });

// ─── Auto-generate slug from name ───
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

/**
 * Helper: get the effective price for a variant.
 * Falls back to basePrice if the variant has no priceOverride.
 */
productSchema.methods.getVariantPrice = function (sku) {
  const variant = this.variants.find((v) => v.sku === sku);
  if (!variant) return null;
  return variant.priceOverride != null ? variant.priceOverride : this.basePrice;
};

module.exports = mongoose.model('Product', productSchema);
