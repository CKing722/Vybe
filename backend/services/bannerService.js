const { hasDatabase, query } = require('../config/db');
const { getMemoryState, randomId } = require('./memoryStore');

const PLATFORM_BANNER_MIN_SPARKS = 500;
const DEFAULT_BANNER_TTL_MS = 12 * 1000;

function shouldCreatePlatformBanner(gift) {
  return Boolean(gift.isPlatformBanner || gift.cost >= PLATFORM_BANNER_MIN_SPARKS);
}

function normalizeBanner(row) {
  return {
    id: row.id,
    type: row.type,
    senderName: row.sender_name,
    performerName: row.performer_name,
    performerId: row.performer_id,
    giftName: row.gift_name,
    sparkAmount: Number(row.spark_amount || 0),
    expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : row.expires_at,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function makeBanner({ senderName, performerName, performerId, gift, ttlMs = DEFAULT_BANNER_TTL_MS }) {
  const now = new Date();
  return {
    id: randomId(),
    type: 'gift',
    sender_name: senderName,
    performer_name: performerName,
    performer_id: performerId,
    gift_name: gift.name,
    spark_amount: gift.cost,
    expires_at: new Date(now.getTime() + ttlMs).toISOString(),
    created_at: now.toISOString(),
  };
}

async function createPlatformBanner({ client, senderName, performerName, performerId, gift, ttlMs }) {
  if (!shouldCreatePlatformBanner(gift)) {
    return null;
  }

  const banner = makeBanner({ senderName, performerName, performerId, gift, ttlMs });

  if (!hasDatabase()) {
    const state = getMemoryState();
    state.banners.unshift(banner);
    return normalizeBanner(banner);
  }

  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO platform_banners (
      type, sender_name, performer_name, performer_id, gift_name, spark_amount, expires_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, type, sender_name, performer_name, performer_id, gift_name,
      spark_amount, expires_at, created_at`,
    [
      banner.type,
      banner.sender_name,
      banner.performer_name,
      banner.performer_id,
      banner.gift_name,
      banner.spark_amount,
      banner.expires_at,
    ]
  );

  return normalizeBanner(rows[0]);
}

async function listActiveBanners({ limit = 10 } = {}) {
  if (!hasDatabase()) {
    const now = Date.now();
    return getMemoryState()
      .banners.filter((banner) => new Date(banner.expires_at).getTime() > now)
      .slice(0, limit)
      .map(normalizeBanner);
  }

  const { rows } = await query(
    `SELECT id, type, sender_name, performer_name, performer_id, gift_name,
      spark_amount, expires_at, created_at
     FROM platform_banners
     WHERE expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map(normalizeBanner);
}

module.exports = {
  PLATFORM_BANNER_MIN_SPARKS,
  createPlatformBanner,
  listActiveBanners,
  shouldCreatePlatformBanner,
};
