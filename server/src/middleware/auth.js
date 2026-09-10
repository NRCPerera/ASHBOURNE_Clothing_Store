const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_ACCESS_SECRET } = require('../config/env');

/**
 * Protect routes — verifies the Bearer access token and attaches
 * the user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    // Attach user (minus password)
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    // Let the global error handler deal with JWT errors
    next(err);
  }
};

/**
 * Admin-only gate — must be used AFTER protect.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Forbidden — admin access required',
  });
};

module.exports = { protect, adminOnly };
