const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { protect, adminOnly } = require('../../middleware/auth');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateVariantStock,
  updateVariants,
} = require('../../controllers/product.controller');

const router = Router();

// All admin product routes require auth + admin role
router.use(protect, adminOnly);

router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ max: 200 })
      .withMessage('Name cannot exceed 200 characters'),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isMongoId()
      .withMessage('Invalid category ID'),
    body('basePrice')
      .isFloat({ min: 0 })
      .withMessage('Base price must be a non-negative number'),
    body('variants')
      .isArray({ min: 1 })
      .withMessage('At least one variant is required'),
    body('variants.*.size')
      .trim()
      .notEmpty()
      .withMessage('Variant size is required'),
    body('variants.*.color')
      .trim()
      .notEmpty()
      .withMessage('Variant color is required'),
    body('variants.*.sku')
      .trim()
      .notEmpty()
      .withMessage('Variant SKU is required'),
    body('variants.*.stock')
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
  ],
  validate,
  createProduct
);

router.put(
  '/:id',
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Product name cannot be empty'),
    body('category')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    body('basePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Base price must be a non-negative number'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  validate,
  updateProduct
);

router.delete('/:id', deleteProduct);

// ─── Variant management ───
router.put(
  '/:id/variants',
  [
    body('variants')
      .isArray({ min: 1 })
      .withMessage('Variants array is required'),
    body('variants.*.size')
      .trim()
      .notEmpty()
      .withMessage('Variant size is required'),
    body('variants.*.color')
      .trim()
      .notEmpty()
      .withMessage('Variant color is required'),
    body('variants.*.sku')
      .trim()
      .notEmpty()
      .withMessage('Variant SKU is required'),
    body('variants.*.stock')
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
  ],
  validate,
  updateVariants
);

// ─── Per-variant stock editor ───
router.put(
  '/:id/variants/:sku/stock',
  [
    body('stock')
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
    body('note')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Note cannot exceed 500 characters'),
  ],
  validate,
  updateVariantStock
);

module.exports = router;
