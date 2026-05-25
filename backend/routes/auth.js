const crypto = require('node:crypto');
const express = require('express');
const { body, cookie } = require('express-validator');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { loginLimiter } = require('../middleware/rateLimiter');
const { signAccessToken, signRefreshToken } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { loginUser, registerUser } = require('../services/authService');
const {
  getActiveRefreshTokenId,
  revokeRefreshTokens,
  setActiveRefreshTokenId,
} = require('../services/refreshTokenStore');
const { unauthorized } = require('../utils/errors');

const router = express.Router();

function setRefreshCookie(res, token) {
  res.cookie('vybe_refresh', token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function authResponse(res, user) {
  const accessToken = signAccessToken(user);
  const refreshTokenId = crypto.randomUUID();
  setActiveRefreshTokenId(user.id, refreshTokenId);
  const refreshToken = signRefreshToken(user, { tokenId: refreshTokenId });
  setRefreshCookie(res, refreshToken);
  return res.status(200).json({ user, accessToken, expiresInSeconds: 15 * 60 });
}

const registerValidation = validate([
  body('email').isEmail().withMessage('email must be a valid email').normalizeEmail(),
  body('password')
    .isString()
    .withMessage('password must be a string')
    .isLength({ min: 8, max: 72 })
    .withMessage('password must be 8-72 characters'),
  body('display_name')
    .customSanitizer((value, { req }) => value ?? req.body.displayName ?? req.body.name)
    .isString()
    .withMessage('display_name must be a string')
    .trim()
    .isLength({ min: 2, max: 32 })
    .withMessage('display_name must be 2-32 characters'),
  body('role')
    .optional()
    .isIn(['viewer', 'performer'])
    .withMessage('role must be viewer or performer'),
]);

const loginValidation = validate([
  body('email').isEmail().withMessage('email must be a valid email').normalizeEmail(),
  body('password').isString().withMessage('password must be a string'),
]);

const refreshValidation = validate([
  cookie('vybe_refresh').exists().withMessage('Refresh token cookie missing'),
]);

router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const user = await registerUser({
      email: req.body.email,
      password: req.body.password,
      displayName: req.body.display_name,
      role: req.body.role || 'viewer',
    });
    return authResponse(res, user);
  } catch (error) {
    return next(error);
  }
});

router.post('/login', loginLimiter, loginValidation, async (req, res, next) => {
  try {
    const user = await loginUser(req.body);
    return authResponse(res, user);
  } catch (error) {
    return next(error);
  }
});

router.post('/refresh', refreshValidation, (req, res, next) => {
  try {
    const token = req.cookies.vybe_refresh;
    if (!token) throw unauthorized('Refresh token missing');

    const payload = jwt.verify(token, env.jwtRefreshSecret);
    if (payload.token_use !== 'refresh') {
      throw unauthorized('Invalid refresh token');
    }
    if (!payload.jti) {
      throw unauthorized('Invalid refresh token');
    }

    const expectedTokenId = getActiveRefreshTokenId(payload.sub);
    if (!expectedTokenId || expectedTokenId !== payload.jti) {
      throw unauthorized('Invalid or rotated refresh token');
    }

    const user = {
      id: payload.sub,
      role: payload.role,
      display_name: payload.display_name || '',
    };

    const rotatedTokenId = crypto.randomUUID();
    setActiveRefreshTokenId(user.id, rotatedTokenId);
    setRefreshCookie(res, signRefreshToken(user, { tokenId: rotatedTokenId }));

    return res.status(200).json({
      accessToken: signAccessToken(user),
      expiresInSeconds: 15 * 60,
    });
  } catch (error) {
    res.clearCookie('vybe_refresh');
    return next(unauthorized('Invalid or expired refresh token'));
  }
});

router.post('/logout', (req, res) => {
  const token = req.cookies.vybe_refresh;
  if (token) {
    try {
      const payload = jwt.verify(token, env.jwtRefreshSecret);
      revokeRefreshTokens(payload.sub);
    } catch (error) {
      // ignore
    }
  }
  res.clearCookie('vybe_refresh');
  res.status(204).end();
});

module.exports = router;
