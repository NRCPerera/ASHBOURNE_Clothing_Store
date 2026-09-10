const { Router } = require('express');
const { protect } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  validateCoupon,
  payDemoOrder,
} = require('../controllers/order.controller');

const router = Router();

// All customer order routes require authentication
router.use(protect);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.post('/validate-coupon', validateCoupon);
router.get('/:id', getOrderById);
router.post('/:id/pay-demo', payDemoOrder);

module.exports = router;
