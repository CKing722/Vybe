const { hasDatabase, query } = require('../config/db');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parseLimit(value) {
  if (value === undefined || value === null || value === '') return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(parsed)));
}

function normalizeFeedItem(item, { performerId, index }) {
  if (!item) return null;

  const type = item.type || 'text';

  return {
    id: item.id ?? `demo-${performerId}-post-${index}`,
    performerId,
    type,
    text: item.text ?? item.text_content ?? item.textContent ?? null,
    mediaUrl: item.mediaUrl ?? item.media_url ?? null,
    mediaThumbnailUrl: item.mediaThumbnailUrl ?? item.media_thumbnail_url ?? null,
    isSubscriberOnly: Boolean(item.isSubscriberOnly ?? item.is_subscriber_only ?? false),
    sparkPrice: Number(item.sparkPrice ?? item.spark_price ?? 0) || 0,
    createdAt: item.createdAt ?? item.created_at ?? null,
    timeAgo: item.timeAgo ?? item.time ?? null,
  };
}

async function listPerformerFeed(performer, { limit } = {}) {
  if (!performer?.id) return [];
  const resolvedLimit = parseLimit(limit);

  if (!hasDatabase()) {
    const posts = performer.posts || [];
    return posts
      .slice(0, resolvedLimit)
      .map((post, index) => normalizeFeedItem(post, { performerId: performer.id, index }))
      .filter(Boolean);
  }

  const { rows } = await query(
    `SELECT id, type, text_content, media_url, media_thumbnail_url,
      is_subscriber_only, spark_price, created_at
     FROM content_posts
     WHERE performer_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [performer.id, resolvedLimit]
  );

  return rows
    .map((row, index) => normalizeFeedItem(row, { performerId: performer.id, index }))
    .filter(Boolean);
}

module.exports = {
  listPerformerFeed,
};

