const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { protect, adminOnly } = require('../../middleware/auth');
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../../controllers/order.controller');

const router = Router();

// All admin order routes require auth + admin role
router.use(protect, adminOnly);

router.get('/', getAllOrders);
router.get('/:id', getOrderById);

router.put(
  '/:id/status',
  [
    body('orderStatus')
      .optional()
      .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid order status'),
    body('paymentStatus')
      .optional()
      .isIn(['pending', 'paid', 'failed', 'refunded'])
      .withMessage('Invalid payment status'),
  ],
  validate,
  updateOrderStatus
);

module.exports = router;
