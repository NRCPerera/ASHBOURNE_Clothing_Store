const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { protect, adminOnly } = require('../../middleware/auth');
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../../controllers/category.controller');

const router = Router();

// All admin category routes require auth + admin role
router.use(protect, adminOnly);

router.get('/', getAllCategories);

router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
  ],
  validate,
  createCategory
);

router.put(
  '/:id',
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Category name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  validate,
  updateCategory
);

router.delete('/:id', deleteCategory);

module.exports = router;
