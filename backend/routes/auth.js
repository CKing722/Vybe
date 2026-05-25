const express = require('express');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { loginLimiter } = require('../middleware/rateLimiter');
const { requireAuth, signAccessToken, signRefreshToken } = require('../middleware/auth');
const { loginUser, registerUser, startTwoFactorSetup, verifyTwoFactorSetup } = require('../services/authService');
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
  const refreshToken = signRefreshToken(user);
  setRefreshCookie(res, refreshToken);
  return res.status(200).json({ user, accessToken, expiresInSeconds: 15 * 60 });
}

router.post('/register', async (req, res, next) => {
  try {
    const user = await registerUser({
      email: req.body.email,
      password: req.body.password,
      displayName: req.body.display_name || req.body.displayName || req.body.name,
      role: req.body.role || 'viewer',
    });
    return authResponse(res, user);
  } catch (error) {
    return next(error);
  }
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const user = await loginUser(req.body);
    return authResponse(res, user);
  } catch (error) {
    return next(error);
  }
});

router.post('/2fa/setup', requireAuth, async (req, res, next) => {
  try {
    const result = await startTwoFactorSetup({ userId: req.user.sub, issuer: 'VYBE' });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.post('/2fa/verify', requireAuth, async (req, res, next) => {
  try {
    const token =
      req.body.token ||
      req.body.twoFactorToken ||
      req.body.two_factor_token ||
      req.body.totp ||
      req.body.otp ||
      req.body.two_factor_code ||
      req.body.twoFactorCode;
    const result = await verifyTwoFactorSetup({ userId: req.user.sub, token });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.post('/refresh', (req, res, next) => {
  try {
    const token = req.cookies.vybe_refresh;
    if (!token) throw unauthorized('Refresh token missing');

    const payload = jwt.verify(token, env.jwtRefreshSecret);
    if (payload.token_use !== 'refresh') {
      throw unauthorized('Invalid refresh token');
    }

    const user = {
      id: payload.sub,
      role: payload.role,
      display_name: payload.display_name || '',
    };
    return res.status(200).json({
      accessToken: signAccessToken(user),
      expiresInSeconds: 15 * 60,
    });
  } catch (error) {
    return next(unauthorized('Invalid or expired refresh token'));
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('vybe_refresh');
  res.status(204).end();
});

module.exports = router;
