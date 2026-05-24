const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { forbidden, unauthorized } = require('../utils/errors');

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      display_name: user.display_name,
    },
    env.jwtSecret,
    { expiresIn: '15m' }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      display_name: user.display_name,
      token_use: 'refresh',
    },
    env.jwtRefreshSecret,
    { expiresIn: '7d' }
  );
}

function readBearerToken(req) {
  const header = req.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  return header.slice(7).trim();
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function optionalAuth(req, res, next) {
  const token = readBearerToken(req);
  if (!token) {
    return next();
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (error) {
    return next(unauthorized('Invalid or expired token'));
  }
}

function requireAuth(req, res, next) {
  const token = readBearerToken(req);
  if (!token) {
    return next(unauthorized());
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (error) {
    return next(unauthorized('Invalid or expired token'));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(forbidden('Insufficient role for this action'));
    }
    return next();
  };
}

module.exports = {
  optionalAuth,
  requireAuth,
  requireRole,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
};
