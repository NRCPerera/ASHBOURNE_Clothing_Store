const { validationResult } = require('express-validator');

/**
 * Middleware that runs after express-validator chains.
 * If any validation errors exist, returns 400 with field-level messages.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

module.exports = validate;
