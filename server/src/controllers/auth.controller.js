const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/tokens');

// ─── POST /api/auth/register ───
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    const userData = { name, email, password };
    if (phone && phone.trim()) {
      userData.phone = phone.trim();
    }

    const user = await User.create(userData);

    // Issue tokens
    const accessToken = generateAccessToken(user);
    const rawRefresh = await generateRefreshToken(user, req.ip);

    setRefreshCookie(res, rawRefresh);

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ───
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Issue tokens
    const accessToken = generateAccessToken(user);
    const rawRefresh = await generateRefreshToken(user, req.ip);

    setRefreshCookie(res, rawRefresh);

    res.json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/refresh ───
const refresh = async (req, res, next) => {
  try {
    const oldToken = req.cookies?.refreshToken;
    if (!oldToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      });
    }

    const { accessToken, rawRefreshToken, user } = await rotateRefreshToken(
      oldToken,
      req.ip
    );

    setRefreshCookie(res, rawRefreshToken);

    res.json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/logout ───
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await revokeRefreshToken(token);
    }
    clearRefreshCookie(res);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ───
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

module.exports = { register, login, refresh, logout, getMe };
