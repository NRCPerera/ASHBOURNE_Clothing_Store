const { Router } = require('express');
const {
  getCategories,
  getCategoryBySlug,
} = require('../controllers/category.controller');

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

module.exports = router;
