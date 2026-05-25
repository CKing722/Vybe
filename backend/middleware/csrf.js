const crypto = require('node:crypto');
const { env } = require('../config/env');
const { forbidden } = require('../utils/errors');

const CSRF_COOKIE_NAME = 'vybe_csrf';
const CSRF_HEADER_NAME = 'x-vybe-csrf';

function generateCsrfToken() {
  return crypto.randomUUID();
}

function setCsrfCookie(res, token) {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: env.isProduction,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

function issueCsrfToken(res) {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  return token;
}

function constantTimeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function requireCsrf(req, res, next) {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return next(forbidden('CSRF token missing'));
  }
  if (!constantTimeEquals(cookieToken, headerToken)) {
    return next(forbidden('Invalid CSRF token'));
  }
  return next();
}

module.exports = {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  issueCsrfToken,
  requireCsrf,
};

