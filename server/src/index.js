const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ─── Route imports ───
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const adminCategoryRoutes = require('./routes/admin/category.routes');
const adminProductRoutes = require('./routes/admin/product.routes');
const adminUploadRoutes = require('./routes/admin/upload.routes');
const adminOrderRoutes = require('./routes/admin/order.routes');
const adminDashboardRoutes = require('./routes/admin/dashboard.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();

// ─── CORS (must be before helmet so preflight OPTIONS gets handled) ───
const allowedOrigins = [env.CLIENT_URL, env.ADMIN_URL].filter(Boolean);
console.log('✅  Allowed CORS origins:', allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow cookies
  })
);

// ─── Security headers ───
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ─── Body parsing ───
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Cookie parsing ───
app.use(cookieParser());

// ─── Request logging ───
if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Health check ───
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API routes ───
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/upload', adminUploadRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);

// ─── 404 handler ───
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler (must be last) ───
app.use(errorHandler);

// ─── Start server ───
const start = async () => {
  await connectDB(env.MONGO_URI);
  app.listen(env.PORT, () => {
    console.log(
      `🚀  ASHBOURNE API running on port ${env.PORT} [${env.NODE_ENV}]`
    );
  });
};

start();

module.exports = app; // export for testing
