const { hasDatabase, query } = require('../config/db');
const { notFound } = require('../utils/errors');

const GIFT_TYPES = [
  {
    id: 'rose',
    name: 'Neon Rose',
    cost: 5,
    icon: 'rose',
    color: '#ff2d78',
    animation_type: 'bloom',
    animation_duration_ms: 1500,
    is_platform_banner: false,
    sort_order: 1,
  },
  {
    id: 'flame',
    name: 'Fire Shot',
    cost: 25,
    icon: 'flame',
    color: '#f97316',
    animation_type: 'trail',
    animation_duration_ms: 2000,
    is_platform_banner: false,
    sort_order: 2,
  },
  {
    id: 'kiss',
    name: 'Blow Kiss',
    cost: 50,
    icon: 'lips',
    color: '#f472b6',
    animation_type: 'float',
    animation_duration_ms: 2500,
    is_platform_banner: false,
    sort_order: 3,
  },
  {
    id: 'diamond',
    name: 'Diamond Rain',
    cost: 150,
    icon: 'diamond',
    color: '#00d4ff',
    animation_type: 'rain',
    animation_duration_ms: 4000,
    is_platform_banner: false,
    sort_order: 4,
  },
  {
    id: 'crown',
    name: 'Crown Drop',
    cost: 500,
    icon: 'crown',
    color: '#fbbf24',
    animation_type: 'descend',
    animation_duration_ms: 6000,
    is_platform_banner: true,
    sort_order: 5,
  },
  {
    id: 'champagne',
    name: 'Champagne',
    cost: 2500,
    icon: 'champagne',
    color: '#c6ff00',
    animation_type: 'burst',
    animation_duration_ms: 8000,
    is_platform_banner: true,
    sort_order: 6,
  },
  {
    id: 'key',
    name: 'Private Key',
    cost: 5000,
    icon: 'key',
    color: '#8b5cf6',
    animation_type: 'cinematic',
    animation_duration_ms: 15000,
    is_platform_banner: true,
    sort_order: 7,
  },
];

function normalizeGift(row) {
  return {
    id: row.id,
    name: row.name,
    cost: Number(row.cost),
    icon: row.icon,
    color: row.color,
    animationType: row.animation_type,
    animationDurationMs: Number(row.animation_duration_ms),
    isPlatformBanner: Boolean(row.is_platform_banner),
    sortOrder: Number(row.sort_order || 0),
  };
}

async function listGiftTypes() {
  if (!hasDatabase()) {
    return GIFT_TYPES.map(normalizeGift);
  }

  const { rows } = await query(
    `SELECT id, name, cost, icon, color, animation_type, animation_duration_ms,
      is_platform_banner, sort_order
     FROM gift_types
     ORDER BY sort_order ASC, cost ASC`
  );
  return rows.map(normalizeGift);
}

async function getGiftType(giftTypeId, client) {
  if (!hasDatabase()) {
    const gift = GIFT_TYPES.find((item) => item.id === giftTypeId);
    if (!gift) {
      throw notFound(`Unknown gift type: ${giftTypeId}`);
    }
    return normalizeGift(gift);
  }

  const executor = client || { query };
  const { rows } = await executor.query(
    `SELECT id, name, cost, icon, color, animation_type, animation_duration_ms,
      is_platform_banner, sort_order
     FROM gift_types
     WHERE id = $1`,
    [giftTypeId]
  );

  if (!rows[0]) {
    throw notFound(`Unknown gift type: ${giftTypeId}`);
  }

  return normalizeGift(rows[0]);
}

module.exports = {
  GIFT_TYPES,
  getGiftType,
  listGiftTypes,
  normalizeGift,
};
