const { Router } = require('express');
const {
  getProducts,
  getProductBySlug,
} = require('../controllers/product.controller');

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

module.exports = router;
