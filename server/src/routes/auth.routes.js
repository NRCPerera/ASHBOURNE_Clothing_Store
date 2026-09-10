const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  refresh,
  logout,
  getMe,
} = require('../controllers/auth.controller');

const router = Router();

// ─── POST /api/auth/register ───
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('phone')
      .optional({ values: 'falsy' })
      .trim()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
  ],
  validate,
  register
);

// ─── POST /api/auth/login ───
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  validate,
  login
);

// ─── POST /api/auth/refresh ───
router.post('/refresh', refresh);

// ─── POST /api/auth/logout ───
router.post('/logout', logout);

// ─── GET /api/auth/me ───
router.get('/me', protect, getMe);

module.exports = router;
