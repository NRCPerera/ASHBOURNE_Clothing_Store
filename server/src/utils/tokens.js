const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} = require('../config/env');

/**
 * Parse a duration string like "15m" or "7d" into milliseconds.
 */
function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) throw new Error(`Invalid duration: ${str}`);
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * multipliers[unit];
}

/**
 * Generate a short-lived JWT access token.
 */
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN }
  );
}

/**
 * Generate a refresh token, store its hash in the DB, and return the raw token.
 */
async function generateRefreshToken(user, ip) {
  // Create a cryptographically random token
  const rawToken = crypto.randomBytes(40).toString('hex');
  const hashedToken = RefreshToken.hashToken(rawToken);

  const expiresAt = new Date(Date.now() + parseDuration(JWT_REFRESH_EXPIRES_IN));

  await RefreshToken.create({
    user: user._id,
    token: hashedToken,
    expiresAt,
    createdByIp: ip,
  });

  return rawToken;
}

/**
 * Rotate a refresh token: validate the old one, delete it, issue a new pair.
 * Returns { accessToken, rawRefreshToken } or throws.
 */
async function rotateRefreshToken(oldRawToken, ip) {
  const hashedOld = RefreshToken.hashToken(oldRawToken);

  // Find and delete the old token atomically
  const existing = await RefreshToken.findOneAndDelete({ token: hashedOld });

  if (!existing) {
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
  }

  if (existing.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token expired'), { statusCode: 401 });
  }

  // Look up the user
  const User = require('../models/User');
  const user = await User.findById(existing.user);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 401 });
  }

  // Issue new pair
  const accessToken = generateAccessToken(user);
  const rawRefreshToken = await generateRefreshToken(user, ip);

  return { accessToken, rawRefreshToken, user };
}

/**
 * Revoke a specific refresh token (logout).
 */
async function revokeRefreshToken(rawToken) {
  const hashed = RefreshToken.hashToken(rawToken);
  await RefreshToken.findOneAndDelete({ token: hashed });
}

/**
 * Revoke ALL refresh tokens for a user (force logout everywhere).
 */
async function revokeAllUserTokens(userId) {
  await RefreshToken.deleteMany({ user: userId });
}

/**
 * Helper: set the refresh token as an httpOnly cookie.
 */
function setRefreshCookie(res, rawToken) {
  const maxAge = parseDuration(JWT_REFRESH_EXPIRES_IN);
  res.cookie('refreshToken', rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    path: '/api/auth', // scoped to auth routes only
  });
}

/**
 * Helper: clear the refresh token cookie.
 */
function clearRefreshCookie(res) {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/api/auth',
  });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  setRefreshCookie,
  clearRefreshCookie,
};
