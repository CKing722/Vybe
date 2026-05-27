const crypto = require('crypto');
const { hasDatabase, query } = require('../config/db');
const { notFound } = require('../utils/errors');
const { getMemoryState } = require('./memoryStore');

const DEMO_BASE_DATE = new Date('2026-01-10T00:00:00.000Z');

function stableUuid(...parts) {
  const hash = crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
}

function demoIsoFromRelativeTime(relative) {
  if (!relative || typeof relative !== 'string') {
    return DEMO_BASE_DATE.toISOString();
  }

  const match = relative.trim().match(/^(\d+)\s*([hd])$/i);
  if (!match) {
    return DEMO_BASE_DATE.toISOString();
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const millis = unit === 'h' ? amount * 60 * 60 * 1000 : amount * 24 * 60 * 60 * 1000;
  return new Date(DEMO_BASE_DATE.getTime() - millis).toISOString();
}

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
  }

  const { rows } = await query(
    `SELECT u.id, u.display_name, u.bio, u.avatar_url, u.banner_url,
      pp.stage_name, pp.vibe, pp.accent_color, pp.subscription_price, pp.trial_days,
      pp.rating, pp.total_sessions, pp.total_hours_live, pp.follower_count,
      pp.is_live, pp.max_session_minutes,
      pc.duo_available, pc.toys_enabled, pc.replay_allowed, pc.wardrobe_available,
      pc.game_modes
     FROM users u
     JOIN performer_profiles pp ON pp.user_id = u.id
     LEFT JOIN performer_capabilities pc ON pc.performer_id = u.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY pp.is_live DESC, pp.follower_count DESC
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
      pp.is_live, pp.max_session_minutes,
      pc.duo_available, pc.toys_enabled, pc.replay_allowed, pc.wardrobe_available,
      pc.game_modes
     FROM users u
     JOIN performer_profiles pp ON pp.user_id = u.id
     LEFT JOIN performer_capabilities pc ON pc.performer_id = u.id
     WHERE u.id::text = $1 AND u.role = 'performer' AND u.is_active = TRUE`,
    [identifier]
  );

  if (!rows[0]) {
    throw notFound('Performer not found');
  }

  return normalizePerformer(rows[0]);
}

function normalizeRequest(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    sparkCost: Number(row.spark_cost || row.sparkCost || 0),
    sortOrder: Number(row.sort_order || row.sortOrder || 0),
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

function normalizeContentPost(row) {
  return {
    id: row.id,
    type: row.type || 'text',
    text: row.text_content ?? row.text ?? null,
    mediaUrl: row.media_url ?? row.mediaUrl ?? null,
    mediaThumbnailUrl: row.media_thumbnail_url ?? row.mediaThumbnailUrl ?? null,
    isSubscriberOnly:
      row.is_subscriber_only !== undefined ? Boolean(row.is_subscriber_only) : Boolean(row.isSubscriberOnly),
    sparkPrice: Number(row.spark_price ?? row.sparkPrice ?? 0),
    isEphemeral: row.is_ephemeral !== undefined ? Boolean(row.is_ephemeral) : Boolean(row.isEphemeral),
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    likeCount: Number(row.like_count ?? row.likeCount ?? 0),
    commentCount: Number(row.comment_count ?? row.commentCount ?? 0),
    viewCount: Number(row.view_count ?? row.viewCount ?? 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

async function getPerformerRequests(identifier) {
  if (!hasDatabase()) {
    const performer = getMemoryState().performerDirectory.find(
      (item) => item.id === identifier || item.slug === identifier
    );
    if (!performer) {
      throw notFound('Performer not found');
    }

    const requests = (performer.requests || []).map((request, index) =>
      normalizeRequest({
        id: stableUuid('request', performer.id, request.name, String(index)),
        name: request.name,
        description: request.desc || '',
        sparkCost: request.sparks,
        sortOrder: index,
        isActive: true,
        created_at: DEMO_BASE_DATE.toISOString(),
      })
    );

    return { performerId: performer.id, requests };
  }

  const { rows } = await query(
    `SELECT id, name, description, spark_cost, is_active, sort_order, created_at
     FROM performer_requests
     WHERE performer_id = $1 AND is_active = TRUE
     ORDER BY sort_order ASC, created_at ASC`,
    [identifier]
  );

  return { performerId: identifier, requests: rows.map(normalizeRequest) };
}

async function getPerformerFeed({ identifier, limit = 25 } = {}) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.trunc(limit))) : 25;

  if (!hasDatabase()) {
    const performer = getMemoryState().performerDirectory.find(
      (item) => item.id === identifier || item.slug === identifier
    );
    if (!performer) {
      throw notFound('Performer not found');
    }

    const posts = (performer.posts || [])
      .slice(0, safeLimit)
      .map((post, index) =>
        normalizeContentPost({
          id: stableUuid('post', performer.id, post.text, String(index)),
          type: 'text',
          text: post.text,
          mediaUrl: null,
          mediaThumbnailUrl: null,
          isSubscriberOnly: false,
          sparkPrice: 0,
          isEphemeral: false,
          expiresAt: null,
          likeCount: 0,
          commentCount: 0,
          viewCount: 0,
          created_at: demoIsoFromRelativeTime(post.time),
        })
      );

    return { performerId: performer.id, posts };
  }

  const { rows } = await query(
    `SELECT id, type, text_content, media_url, media_thumbnail_url,
        is_subscriber_only, spark_price, is_ephemeral, expires_at,
        like_count, comment_count, view_count, created_at
     FROM content_posts
     WHERE performer_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [identifier, safeLimit]
  );

  return { performerId: identifier, posts: rows.map(normalizeContentPost) };
}

module.exports = {
  getPerformer,
  getPerformerFeed,
  getPerformerRequests,
  listPerformers,
  normalizePerformer,
};
