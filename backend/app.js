const cookieParser = require('cookie-parser');
const express = require('express');
const { createApiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { securityMiddleware } = require('./middleware/security');
const authRoutes = require('./routes/auth');
const bannerRoutes = require('./routes/banners');
const gamesRoutes = require('./routes/games');
const giftRoutes = require('./routes/gifts').router;
const healthRoutes = require('./routes/health');
const performerRoutes = require('./routes/performers');
const sparkRoutes = require('./routes/sparks');
const userRoutes = require('./routes/users');

function createApp() {
  const app = express();
  const apiLimiter = createApiLimiter();

  app.use(securityMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter);

  app.use('/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/banners', bannerRoutes);
  app.use('/api', userRoutes);
  app.use('/api/games', gamesRoutes);
  app.use('/api/gifts', giftRoutes);
  app.use('/api/performers', performerRoutes);
  app.use('/api/sparks', sparkRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
