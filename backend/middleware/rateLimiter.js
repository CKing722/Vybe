const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');
const { env } = require('../config/env');

function createRedisStore(prefix) {
  if (!env.redisUrl) return undefined;
  let clientPromise;
  const store = {
    windowMs: 60 * 1000,
    init(options) {
      this.windowMs = options.windowMs;
    },
    async client() {
      if (!clientPromise) {
        const client = createClient({ url: env.redisUrl });
        client.on('error', (error) => {
          console.error('rate_limit_redis_error', error.message);
        });
        clientPromise = client.connect().then(() => client);
      }
      return clientPromise;
    },
    async increment(key) {
      const client = await this.client();
      const redisKey = `${prefix}:${key}`;
      const totalHits = await client.incr(redisKey);
      if (totalHits === 1) await client.pExpire(redisKey, this.windowMs);
      const ttl = await client.pTTL(redisKey);
      return {
        totalHits,
        resetTime: new Date(Date.now() + Math.max(ttl, this.windowMs)),
      };
    },
    async decrement(key) {
      const client = await this.client();
      await client.decr(`${prefix}:${key}`);
    },
    async resetKey(key) {
      const client = await this.client();
      await client.del(`${prefix}:${key}`);
    },
  };
  return store;
}

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  store: createRedisStore('vybe:rl:api'),
  passOnStoreError: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: createRedisStore('vybe:rl:login'),
  passOnStoreError: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'too_many_login_attempts',
      message: 'Too many login attempts; try again later',
    },
  },
});

module.exports = { apiLimiter, loginLimiter };
