/**
 * Global error-handling middleware.
 *
 * Catches all errors thrown or passed via next(err) and returns
 * a consistent JSON shape: { success: false, message, errors? }
 */
const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  // ─── Mongoose validation error ───
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ─── Mongoose duplicate key error ───
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate value for "${field}"`;
  }

  // ─── Mongoose bad ObjectId ───
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid ID: ${err.value}`;
  }

  // ─── JWT errors ───
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log stack in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ ', err.stack || err);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
