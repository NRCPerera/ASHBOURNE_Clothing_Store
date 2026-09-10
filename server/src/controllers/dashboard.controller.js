const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');

// ─── GET /api/admin/dashboard/stats ───
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalCategories,
      totalOrders,
      totalCustomers,
      revenueAgg,
      recentOrders,
      products,
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .select('-__v'),
      Product.find().select('variants name'),
    ]);

    // Count low-stock variants (stock <= 5)
    let lowStockCount = 0;
    const lowStockItems = [];
    for (const product of products) {
      for (const variant of product.variants) {
        if (variant.stock <= 5) {
          lowStockCount++;
          if (lowStockItems.length < 10) {
            lowStockItems.push({
              productName: product.name,
              productId: product._id,
              sku: variant.sku,
              size: variant.size,
              color: variant.color,
              stock: variant.stock,
            });
          }
        }
      }
    }

    // Order status breakdown
    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalCategories,
        totalOrders,
        totalCustomers,
        totalRevenue: revenueAgg[0]?.total || 0,
        lowStockCount,
        lowStockItems,
        recentOrders,
        orderStatusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats };
