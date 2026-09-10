/**
 * Seed script: populates the database with sample categories and products.
 * Usage:  node src/scripts/seedProducts.js
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const Category = require('../models/Category');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const User = require('../models/User');

const CATEGORIES = [
  { name: 'T-Shirts', description: 'Premium cotton and blend tees for everyday wear' },
  { name: 'Shirts', description: 'Formal and casual shirts for every occasion' },
  { name: 'Jeans', description: 'Classic denim in modern cuts and washes' },
  { name: 'Jackets', description: 'Outerwear for every season' },
  { name: 'Accessories', description: 'Belts, hats, scarves, and more' },
  { name: 'Shoes', description: 'Footwear from casual to formal' },
];

const COLORS = ['Black', 'White', 'Navy', 'Grey', 'Olive', 'Burgundy', 'Cream'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['7', '8', '9', '10', '11', '12'];

function generateVariants(prefix, sizes, colors, baseStock = 10) {
  const variants = [];
  const selectedColors = colors.slice(0, 3); // 3 colors per product
  const selectedSizes = sizes.slice(1, 5);   // 4 sizes per product

  for (const color of selectedColors) {
    for (const size of selectedSizes) {
      variants.push({
        size,
        color,
        sku: `${prefix}-${color.substring(0, 3).toUpperCase()}-${size}`,
        stock: Math.floor(Math.random() * baseStock) + 2,
        priceOverride: null,
      });
    }
  }
  return variants;
}

const PRODUCTS = [
  {
    name: 'Essential Cotton Crew Tee',
    description: 'Ultra-soft 100% organic cotton t-shirt with a relaxed crew neck. Pre-shrunk fabric with reinforced seams for lasting comfort. A wardrobe staple that pairs with everything.',
    categoryName: 'T-Shirts',
    brand: 'ASHBOURNE',
    basePrice: 2490,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800',
    ],
    variantPrefix: 'ECT',
  },
  {
    name: 'Vintage Wash Graphic Tee',
    description: 'Retro-inspired graphic print on garment-dyed cotton. Each piece develops a unique patina over time. Bold artwork meets comfortable everyday wear.',
    categoryName: 'T-Shirts',
    brand: 'ASHBOURNE',
    basePrice: 3290,
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
    ],
    variantPrefix: 'VGT',
  },
  {
    name: 'Oxford Button-Down Shirt',
    description: 'Classic oxford cloth button-down in a modern slim fit. Genuine mother-of-pearl buttons. Perfect transition from office to evening.',
    categoryName: 'Shirts',
    brand: 'ASHBOURNE',
    basePrice: 4990,
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
    ],
    variantPrefix: 'OBD',
  },
  {
    name: 'Linen Summer Shirt',
    description: 'Breathable pure linen shirt with a relaxed fit. Stone-washed for softness. Your go-to for warm-weather sophistication.',
    categoryName: 'Shirts',
    brand: 'ASHBOURNE',
    basePrice: 5490,
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
    ],
    variantPrefix: 'LSS',
  },
  {
    name: 'Slim Fit Dark Indigo Jeans',
    description: 'Japanese selvedge denim in a deep indigo wash. Slim through the hip and thigh with a tapered leg. Raw hem for a contemporary edge.',
    categoryName: 'Jeans',
    brand: 'ASHBOURNE',
    basePrice: 6990,
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
    ],
    variantPrefix: 'SDJ',
  },
  {
    name: 'Relaxed Straight Fit Jeans',
    description: 'Comfortable mid-rise jeans with a straight leg silhouette. Soft stretch denim in a versatile stone wash. Built for all-day comfort.',
    categoryName: 'Jeans',
    brand: 'ASHBOURNE',
    basePrice: 5990,
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
    ],
    variantPrefix: 'RSJ',
  },
  {
    name: 'Leather Biker Jacket',
    description: 'Full-grain lambskin leather jacket with asymmetric zip. Satin-lined interior with internal pockets. A timeless statement piece.',
    categoryName: 'Jackets',
    brand: 'ASHBOURNE',
    basePrice: 24990,
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    ],
    variantPrefix: 'LBJ',
  },
  {
    name: 'Quilted Puffer Jacket',
    description: 'Lightweight recycled-fill puffer with DWR coating. Packs into its own pocket for travel. Warmth without the bulk.',
    categoryName: 'Jackets',
    brand: 'ASHBOURNE',
    basePrice: 12990,
    images: [
      'https://images.unsplash.com/photo-1544923246-77307dd270b5?w=800',
    ],
    variantPrefix: 'QPJ',
  },
  {
    name: 'Canvas Weekender Bag',
    description: 'Waxed canvas weekender with vegetable-tanned leather handles. Brass hardware. Spacious main compartment with interior zip pocket.',
    categoryName: 'Accessories',
    brand: 'ASHBOURNE',
    basePrice: 8990,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    ],
    variantPrefix: 'CWB',
    useSizes: ['One Size'],
    useColors: ['Black', 'Olive', 'Navy'],
  },
  {
    name: 'Leather Chelsea Boots',
    description: 'Italian calfskin Chelsea boots with Goodyear welt construction. Cushioned insole with arch support. Break in once, wear forever.',
    categoryName: 'Shoes',
    brand: 'ASHBOURNE',
    basePrice: 18990,
    images: [
      'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800',
    ],
    variantPrefix: 'LCB',
    useSizes: SHOE_SIZES,
  },
];

async function seed() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find admin user for stock movements
    const admin = await User.findOne({ role: 'admin' });

    // Clear existing data
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      StockMovement.deleteMany({}),
    ]);
    console.log('Cleared existing categories, products, and stock movements');

    // Create categories
    const categoryDocs = await Category.insertMany(CATEGORIES);
    const categoryMap = {};
    for (const cat of categoryDocs) {
      categoryMap[cat.name] = cat._id;
    }
    console.log(`✅  Created ${categoryDocs.length} categories`);

    // Create products
    const allMovements = [];

    for (const p of PRODUCTS) {
      const sizes = p.useSizes || SIZES;
      const colors = p.useColors || COLORS;
      const variants = p.useSizes && p.useSizes[0] === 'One Size'
        ? p.useColors.map((color) => ({
            size: 'One Size',
            color,
            sku: `${p.variantPrefix}-${color.substring(0, 3).toUpperCase()}-OS`,
            stock: Math.floor(Math.random() * 15) + 3,
            priceOverride: null,
          }))
        : generateVariants(p.variantPrefix, sizes, colors);

      const product = await Product.create({
        name: p.name,
        description: p.description,
        category: categoryMap[p.categoryName],
        brand: p.brand,
        basePrice: p.basePrice,
        images: p.images,
        variants,
      });

      // Log stock movements
      for (const v of product.variants) {
        if (v.stock > 0) {
          allMovements.push({
            product: product._id,
            variantSku: v.sku,
            delta: v.stock,
            reason: 'restock',
            resultingStock: v.stock,
            performedBy: admin?._id || null,
            note: 'Initial seed data',
          });
        }
      }

      console.log(`  📦  ${product.name} (${product.variants.length} variants)`);
    }

    if (allMovements.length > 0) {
      await StockMovement.insertMany(allMovements);
    }

    console.log(`\n✅  Seeded ${PRODUCTS.length} products with ${allMovements.length} stock movements`);
    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
