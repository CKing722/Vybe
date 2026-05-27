const { hasDatabase, query } = require('../config/db');
const { notFound } = require('../utils/errors');
const { getMemoryState } = require('./memoryStore');

function normalizePerformer(row) {
  return {
    id: row.id,
    slug: row.slug || row.id,
    roomId: row.room_id || row.id,
    name: row.name || row.display_name || row.stage_name,
    stageName: row.stage_name || row.display_name,
    vibe: row.vibe || '',
    viewers: Number(row.viewers || 0),
    game: row.game || null,
    level: row.level || 'warm',
    tags: row.tags || [],
    accent: row.accent || row.accent_color || '#ff2d78',
    rating: Number(row.rating || 0),
    sessions: Number(row.sessions || row.total_sessions || 0),
    categories: row.categories || [],
    caps: row.caps || {
      duo: Boolean(row.duo_available),
      toys: Boolean(row.toys_enabled),
      replay: Boolean(row.replay_allowed),
      wardrobe: Boolean(row.wardrobe_available),
      maxMins: Number(row.max_session_minutes || 60),
      games: row.game_modes || [],
    },
    bio: row.bio || '',
    subscription: row.subscription || {
      price: row.subscription_price ? Number(row.subscription_price) : null,
      trial: Number(row.trial_days || 0),
    },
    schedule: row.schedule || [],
    stats: row.stats || {
      hoursLive: Number(row.total_hours_live || 0),
      followers: Number(row.follower_count || 0),
    },
    compliance: {
      verificationStatus: row.verification_status || (row.is_live ? 'verified' : 'pending'),
      idVerified: Boolean(row.id_verified || row.verification_status === 'verified' || row.is_live),
      canReceiveBookings: Boolean(
        row.can_receive_bookings || row.verification_status === 'verified' || row.is_live
      ),
    },
    requests: row.requests || [],
    posts: row.posts || [],
    isLive: Boolean(row.is_live),
  };
}

function filterMemoryPerformers(performers, filters) {
  let results = [...performers];

  if (filters.live === 'true') {
    results = results.filter((performer) => performer.is_live);
  }

  if (filters.category && filters.category !== 'All') {
    const category = filters.category.toLowerCase();
    results = results.filter((performer) =>
      performer.categories.some((item) => item.toLowerCase() === category)
    );
  }

  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (performer) =>
        performer.name.toLowerCase().includes(q) ||
        performer.vibe.toLowerCase().includes(q) ||
        performer.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  if (filters.sort === 'viewers') {
    results.sort((a, b) => b.viewers - a.viewers);
  } else if (filters.sort === 'rating') {
    results.sort((a, b) => b.rating - a.rating);
  } else {
    results.sort((a, b) => Number(b.is_live) - Number(a.is_live) || b.viewers - a.viewers);
  }

  return results;
}

async function listPerformers(filters = {}) {
  if (!hasDatabase()) {
    return filterMemoryPerformers(getMemoryState().performerDirectory, filters).map(normalizePerformer);
  }

  const conditions = ["u.role = 'performer'", 'u.is_active = TRUE'];
  const params = [];

  if (filters.live === 'true') {
    conditions.push('pp.is_live = TRUE');
    conditions.push("pp.verification_status = 'verified'");
  }
  if (filters.category && filters.category !== 'All') {
    params.push(String(filters.category).toLowerCase());
    conditions.push(
      `EXISTS (
        SELECT 1 FROM performer_categories pcat
        WHERE pcat.performer_id = u.id AND lower(pcat.category) = $${params.length}
      )`
    );
  }
  if (filters.query) {
    params.push(`%${String(filters.query).toLowerCase()}%`);
    conditions.push(
      `(lower(u.display_name) LIKE $${params.length}
        OR lower(COALESCE(pp.stage_name, '')) LIKE $${params.length}
        OR lower(COALESCE(pp.vibe, '')) LIKE $${params.length})`
    );
  }

  const orderBy =
    filters.sort === 'rating'
      ? 'pp.rating DESC NULLS LAST, pp.follower_count DESC'
      : filters.sort === 'viewers'
        ? 'pp.follower_count DESC, pp.rating DESC NULLS LAST'
        : 'pp.is_live DESC, pp.follower_count DESC';

  const { rows } = await query(
    `SELECT u.id, u.display_name, u.bio, u.avatar_url, u.banner_url,
      pp.stage_name, pp.vibe, pp.accent_color, pp.subscription_price, pp.trial_days,
      pp.rating, pp.total_sessions, pp.total_hours_live, pp.follower_count,
      pp.is_live, pp.max_session_minutes, pp.verification_status, pp.id_verified,
      pp.can_receive_bookings,
      pc.duo_available, pc.toys_enabled, pc.replay_allowed, pc.wardrobe_available,
      pc.game_modes,
      COALESCE((
        SELECT jsonb_agg(pcat.category ORDER BY pcat.category)
        FROM performer_categories pcat
        WHERE pcat.performer_id = u.id
      ), '[]'::jsonb) AS categories
     FROM users u
     JOIN performer_profiles pp ON pp.user_id = u.id
     LEFT JOIN performer_capabilities pc ON pc.performer_id = u.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT 50`,
    params
  );

  return rows.map(normalizePerformer);
}

async function getPerformer(identifier) {
  if (!hasDatabase()) {
    const performer = getMemoryState().performerDirectory.find(
      (item) => item.id === identifier || item.slug === identifier
    );
    if (!performer) {
      throw notFound('Performer not found');
    }
    return normalizePerformer(performer);
  }

  const { rows } = await query(
    `SELECT u.id, u.display_name, u.bio, u.avatar_url, u.banner_url,
      pp.stage_name, pp.vibe, pp.accent_color, pp.subscription_price, pp.trial_days,
      pp.rating, pp.total_sessions, pp.total_hours_live, pp.follower_count,
      pp.is_live, pp.max_session_minutes, pp.verification_status, pp.id_verified,
      pp.can_receive_bookings,
      pc.duo_available, pc.toys_enabled, pc.replay_allowed, pc.wardrobe_available,
      pc.game_modes,
      COALESCE((
        SELECT jsonb_agg(pcat.category ORDER BY pcat.category)
        FROM performer_categories pcat
        WHERE pcat.performer_id = u.id
      ), '[]'::jsonb) AS categories
     FROM users u
     JOIN performer_profiles pp ON pp.user_id = u.id
     LEFT JOIN performer_capabilities pc ON pc.performer_id = u.id
     WHERE (u.id::text = $1 OR lower(COALESCE(pp.stage_name, u.display_name)) = lower($1))
       AND u.role = 'performer' AND u.is_active = TRUE`,
    [identifier]
  );

  if (!rows[0]) {
    throw notFound('Performer not found');
  }

  return normalizePerformer(rows[0]);
}

module.exports = {
  getPerformer,
  listPerformers,
  normalizePerformer,
};
