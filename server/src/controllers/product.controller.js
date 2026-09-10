const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

// ─── GET /api/products ─── (public, with filtering)
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      size,
      color,
      minPrice,
      maxPrice,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { isActive: true };

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Size filter — match any variant with this size
    if (size) {
      filter['variants.size'] = { $in: size.split(',') };
    }

    // Color filter — match any variant with this color
    if (color) {
      filter['variants.color'] = { $in: color.split(',') };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.basePrice.$lte = parseFloat(maxPrice);
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Parse sort
    let sortObj = {};
    if (search && sort === '-createdAt') {
      // Default to relevance when searching
      sortObj = { score: { $meta: 'textScore' } };
    } else {
      // Parse sort string like "price" or "-createdAt"
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortDir = sort.startsWith('-') ? -1 : 1;
      const fieldMap = { price: 'basePrice', name: 'name', date: 'createdAt', createdAt: 'createdAt' };
      sortObj[fieldMap[sortField] || sortField] = sortDir;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = parseInt(limit, 10);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .select('-__v'),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page, 10),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/products/:slug ─── (public)
const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: { product },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/admin/products ─── (admin)
const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, brand, basePrice, images, variants } = req.body;

    const product = await Product.create({
      name,
      description,
      category,
      brand,
      basePrice,
      images: images || [],
      variants,
    });

    // Log initial stock for each variant
    if (variants && variants.length > 0) {
      const movements = variants
        .filter((v) => v.stock > 0)
        .map((v) => ({
          product: product._id,
          variantSku: v.sku.toUpperCase(),
          delta: v.stock,
          reason: 'restock',
          resultingStock: v.stock,
          performedBy: req.user._id,
          note: 'Initial stock on product creation',
        }));

      if (movements.length > 0) {
        await StockMovement.insertMany(movements);
      }
    }

    const populated = await Product.findById(product._id).populate('category', 'name slug');

    res.status(201).json({
      success: true,
      data: { product: populated },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/admin/products/:id ─── (admin)
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, category, brand, basePrice, images, isActive } = req.body;

    // Don't allow variant updates through this route — use the stock endpoint
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, category, brand, basePrice, images, isActive },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: { product },
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/admin/products/:id ─── (admin)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product deleted',
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/products ─── (admin — includes inactive)
const getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = parseInt(limit, 10);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-__v'),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page, 10),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/products/:id ─── (admin — single product by ID)
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: { product },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/admin/products/:id/variants/:sku/stock ─── (admin)
// This is the admin stock editor — manually set or adjust stock
const updateVariantStock = async (req, res, next) => {
  try {
    const { id, sku } = req.params;
    const { stock, note } = req.body;
    const newStock = parseInt(stock, 10);

    if (isNaN(newStock) || newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative integer',
      });
    }

    // Find the product and the specific variant
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const variant = product.variants.find(
      (v) => v.sku === sku.toUpperCase()
    );
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: `Variant with SKU "${sku}" not found`,
      });
    }

    const oldStock = variant.stock;
    const delta = newStock - oldStock;

    if (delta === 0) {
      return res.json({
        success: true,
        message: 'Stock unchanged',
        data: { variant },
      });
    }

    // Update stock atomically
    const updated = await Product.findOneAndUpdate(
      { _id: id, 'variants.sku': sku.toUpperCase() },
      { $set: { 'variants.$.stock': newStock } },
      { new: true }
    ).populate('category', 'name slug');

    // Log the stock movement
    await StockMovement.create({
      product: id,
      variantSku: sku.toUpperCase(),
      delta,
      reason: delta > 0 ? 'restock' : 'admin_correction',
      resultingStock: newStock,
      performedBy: req.user._id,
      note: note || `Admin stock ${delta > 0 ? 'restock' : 'correction'}: ${oldStock} → ${newStock}`,
    });

    res.json({
      success: true,
      data: { product: updated },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/admin/products/:id/variants ─── (admin — add/update variants)
const updateVariants = async (req, res, next) => {
  try {
    const { variants } = req.body;

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Variants array is required',
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Track stock changes for audit
    const movements = [];

    for (const incoming of variants) {
      const existing = product.variants.find(
        (v) => v.sku === incoming.sku.toUpperCase()
      );

      if (existing) {
        const delta = incoming.stock - existing.stock;
        if (delta !== 0) {
          movements.push({
            product: product._id,
            variantSku: incoming.sku.toUpperCase(),
            delta,
            reason: delta > 0 ? 'restock' : 'admin_correction',
            resultingStock: incoming.stock,
            performedBy: req.user._id,
            note: `Variant update: ${existing.stock} → ${incoming.stock}`,
          });
        }
        existing.size = incoming.size;
        existing.color = incoming.color;
        existing.stock = incoming.stock;
        existing.priceOverride = incoming.priceOverride ?? null;
      } else {
        // New variant
        product.variants.push({
          size: incoming.size,
          color: incoming.color,
          sku: incoming.sku.toUpperCase(),
          stock: incoming.stock || 0,
          priceOverride: incoming.priceOverride ?? null,
        });

        if (incoming.stock > 0) {
          movements.push({
            product: product._id,
            variantSku: incoming.sku.toUpperCase(),
            delta: incoming.stock,
            reason: 'restock',
            resultingStock: incoming.stock,
            performedBy: req.user._id,
            note: 'New variant added',
          });
        }
      }
    }

    await product.save();

    if (movements.length > 0) {
      await StockMovement.insertMany(movements);
    }

    const populated = await Product.findById(product._id).populate('category', 'name slug');

    res.json({
      success: true,
      data: { product: populated },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateVariantStock,
  updateVariants,
};
