const cors = require('cors');
const helmet = require('helmet');
const { env } = require('../config/env');

function securityMiddleware() {
  return [
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.isProduction
        ? undefined
        : false,
    }),
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS origin not allowed: ${origin}`));
      },
      credentials: true,
    }),
  ];
}

module.exports = { securityMiddleware };
