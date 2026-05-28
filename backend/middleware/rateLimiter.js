const rateLimit = require('express-rate-limit');
const { verifyAccessToken } = require('./auth');

function readBearerToken(req) {
  const header = req.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  return header.slice(7).trim();
}

function apiRateLimitKey(req) {
  const token = readBearerToken(req);
  if (!token) return req.ip;

  try {
    const payload = verifyAccessToken(token);
    if (payload?.sub) return `user:${payload.sub}`;
  } catch (error) {
    // Fall back to IP-based limiting for invalid tokens.
  }

  return req.ip;
}

function createApiLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: apiRateLimitKey,
    message: {
      error: {
        code: 'too_many_requests',
        message: 'Too many requests; try again later',
      },
    },
  });
}

function createLoginLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'too_many_login_attempts',
        message: 'Too many login attempts; try again later',
      },
    },
  });
}

module.exports = {
  apiRateLimitKey,
  createApiLimiter,
  createLoginLimiter,
};
