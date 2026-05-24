require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const databaseUrl = process.env.DATABASE_URL || '';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 4000),
  databaseUrl,
  redisUrl: process.env.REDIS_URL || '',
  frontendUrl,
  corsOrigins: (process.env.CORS_ORIGINS || frontendUrl)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'vybe-local-access-secret-change-before-production',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || 'vybe-local-refresh-secret-change-before-production',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  useMemoryStore: !databaseUrl && !isProduction,
  enablePaidAi:
    process.env.ENABLE_PAID_AI === 'true' && Boolean(process.env.ANTHROPIC_API_KEY),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
};

if (isProduction) {
  const missing = [];
  if (!databaseUrl) missing.push('DATABASE_URL');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) missing.push('JWT_SECRET');
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    missing.push('JWT_REFRESH_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Missing production environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { env };
