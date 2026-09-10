const dotenv = require('dotenv');
const path = require('path');

// Load .env from server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ─── Required environment variables by phase ───
const REQUIRED = {
  phase1: ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'],
  // phase2: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
  // phase3: ['PAYHERE_MERCHANT_ID', 'PAYHERE_MERCHANT_SECRET'],
};

// Fail fast if any required var is missing
const missing = REQUIRED.phase1.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `❌  Missing required environment variables:\n   ${missing.join(', ')}\n` +
      `   Copy server/.env.example to server/.env and fill in the values.`
  );
  process.exit(1);
}

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:5174',

  // Phase 2+
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Phase 3+
  PAYHERE_MERCHANT_ID: process.env.PAYHERE_MERCHANT_ID,
  PAYHERE_MERCHANT_SECRET: process.env.PAYHERE_MERCHANT_SECRET,
  PAYHERE_SANDBOX: process.env.PAYHERE_SANDBOX === 'true',
};
