const cors = require('cors');
const helmet = require('helmet');
const { env } = require('../config/env');

function securityMiddleware() {
  const csp = {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      scriptSrc: env.isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'"],
      connectSrc: [
        "'self'",
        env.frontendUrl,
        ...env.corsOrigins,
        'ws://localhost:5173',
        'ws://127.0.0.1:5173',
      ],
    },
  };
  return [
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: csp,
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
