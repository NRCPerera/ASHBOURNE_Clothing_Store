const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const {
  generateCheckoutHash,
  PAYHERE_CHECKOUT_URL,
  PAYHERE_MERCHANT_ID,
} = require('../utils/payhere');
const { CLIENT_URL } = require('../config/env');

// ─── POST /api/orders ─── Create a new order (pending)
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, couponCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item',
      });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city ||
        !shippingAddress.postalCode || !shippingAddress.country) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required',
      });
    }

    // ── Recompute prices server-side — never trust client totals ──
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { productId, variantSku, quantity } = item;

      if (!productId || !variantSku || !quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid item: productId, variantSku, and quantity (>=1) are required`,
        });
      }

      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${productId} not found or inactive`,
        });
      }

      const variant = product.variants.find((v) => v.sku === variantSku.toUpperCase());
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Variant ${variantSku} not found in product "${product.name}"`,
        });
      }

      // ── Server-side stock check (soft check — the atomic decrement is the real guard) ──
      if (variant.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}" (${variant.color} / ${variant.size}). Available: ${variant.stock}, requested: ${quantity}`,
        });
      }

      const unitPrice = variant.priceOverride != null ? variant.priceOverride : product.basePrice;
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      // Snapshot the product data at purchase time
      orderItems.push({
        product: product._id,
        productName: product.name,
        variantSku: variant.sku,
        size: variant.size,
        color: variant.color,
        price: unitPrice,
        quantity,
      });
    }

    // ── Apply coupon if provided ──
    let discount = 0;
    let couponId = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coupon code',
        });
      }

      const validity = coupon.checkValidity(subtotal);
      if (!validity.valid) {
        return res.status(400).json({
          success: false,
          message: validity.reason,
        });
      }

      discount = coupon.calculateDiscount(subtotal);
      couponId = coupon._id;
    }

    const total = Math.max(subtotal - discount, 0);

    // ── Create the order (status: pending) ──
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      discount,
      total,
      coupon: couponId,
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });

    // ── Generate PayHere checkout data ──
    const payhereHash = generateCheckoutHash(order._id.toString(), total);

    const payhereData = {
      sandbox: process.env.PAYHERE_SANDBOX === 'true',
      merchant_id: PAYHERE_MERCHANT_ID,
      return_url: `${CLIENT_URL}/orders/${order._id}?payment=success`,
      cancel_url: `${CLIENT_URL}/orders/${order._id}?payment=cancelled`,
      notify_url: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/payhere/notify`,
      order_id: order._id.toString(),
      items: orderItems.map((i) => i.productName).join(', '),
      currency: 'LKR',
      amount: total.toFixed(2),
      first_name: req.user.name.split(' ')[0],
      last_name: req.user.name.split(' ').slice(1).join(' ') || '-',
      email: req.user.email,
      phone: req.user.phone || shippingAddress.phone || '0000000000',
      address: shippingAddress.street,
      city: shippingAddress.city,
      country: shippingAddress.country,
      hash: payhereHash,
      checkout_url: PAYHERE_CHECKOUT_URL,
    };

    res.status(201).json({
      success: true,
      data: {
        order,
        payhere: payhereData,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/orders ─── Get my orders
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = parseInt(limit, 10);

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-__v'),
      Order.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      success: true,
      data: {
        orders,
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

// ─── GET /api/orders/:id ─── Get order by ID (owner only)
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Only the order owner or an admin can view it
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/orders ─── Get all orders (admin)
const getAllOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      orderStatus,
      paymentStatus,
      search,
    } = req.query;

    const filter = {};
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Search by order ID prefix or customer email
    if (search) {
      // Try to match as ObjectId prefix or look up users by email
      const User = require('../models/User');
      const matchingUsers = await User.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [{ user: { $in: userIds } }];

      // If the search looks like an ObjectId, also match by _id
      if (/^[0-9a-fA-F]{24}$/.test(search)) {
        filter.$or.push({ _id: search });
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = parseInt(limit, 10);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-__v'),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        orders,
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

// ─── PUT /api/admin/orders/:id/status ─── Update order status (admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const update = {};
    if (orderStatus) update.orderStatus = orderStatus;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one of orderStatus or paymentStatus is required',
      });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // If order is confirmed/processing and payment is paid, decrement stock
    // (stock decrement on payment confirmation is handled elsewhere)

    res.json({
      success: true,
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/orders/validate-coupon ─── Check coupon validity and discount
const validateCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }
    const validity = coupon.checkValidity(Number(amount) || 0);
    if (!validity.valid) {
      return res.status(400).json({ success: false, message: validity.reason });
    }
    const discount = coupon.calculateDiscount(Number(amount) || 0);
    res.json({
      success: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/orders/:id/pay-demo ─── Direct simulated payment for testing / demo
const payDemoOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (order.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Order is already marked as paid',
        data: { order },
      });
    }

    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    await order.save();

    // Decrement stock for ordered items
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, 'variants.sku': item.variantSku },
        { $inc: { 'variants.$.stock': -item.quantity } }
      );
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  validateCoupon,
  payDemoOrder,
};

