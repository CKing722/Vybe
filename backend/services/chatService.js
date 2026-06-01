const { hasDatabase, query } = require('../config/db');
const { notFound } = require('../utils/errors');
const { getMemoryState, randomId } = require('./memoryStore');

function nowIso() {
  return new Date().toISOString();
}

function normalizeDirectMessage(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    message: row.message,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

function publicUserSummary(user) {
  return {
    id: user.id,
    displayName: user.display_name,
    role: user.role,
  };
}

async function sendDirectMessage({ senderId, recipientId, message }) {
  if (!hasDatabase()) {
    const state = getMemoryState();
    const sender = state.users.get(senderId);
    const recipient = state.users.get(recipientId);
    if (!sender) throw notFound('Sender not found');
    if (!recipient) throw notFound('Recipient not found');

    const record = {
      id: randomId(),
      sender_id: senderId,
      recipient_id: recipientId,
      message,
      is_read: false,
      created_at: nowIso(),
    };
    state.directMessages.push(record);
    return normalizeDirectMessage(record);
  }

  const { rows } = await query(
    `INSERT INTO direct_messages (sender_id, recipient_id, message)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, recipient_id, message, is_read, created_at`,
    [senderId, recipientId, message]
  );

  return normalizeDirectMessage(rows[0]);
}

async function listDirectMessages(userId, otherUserId, options = {}) {
  const limit = Number(options.limit || 50);

  if (!hasDatabase()) {
    const state = getMemoryState();
    const other = state.users.get(otherUserId);
    if (!other) throw notFound('User not found');

    return state.directMessages
      .filter(
        (msg) =>
          (msg.sender_id === userId && msg.recipient_id === otherUserId) ||
          (msg.sender_id === otherUserId && msg.recipient_id === userId)
      )
      .slice(-limit)
      .map(normalizeDirectMessage);
  }

  const { rows } = await query(
    `SELECT id, sender_id, recipient_id, message, is_read, created_at
     FROM direct_messages
     WHERE (sender_id = $1 AND recipient_id = $2)
        OR (sender_id = $2 AND recipient_id = $1)
     ORDER BY created_at ASC
     LIMIT $3`,
    [userId, otherUserId, limit]
  );

  return rows.map(normalizeDirectMessage);
}

async function listConversations(userId, options = {}) {
  const limit = Number(options.limit || 25);

  if (!hasDatabase()) {
    const state = getMemoryState();
    const latestByOther = new Map();

    for (const message of state.directMessages) {
      if (message.sender_id !== userId && message.recipient_id !== userId) continue;
      const otherId = message.sender_id === userId ? message.recipient_id : message.sender_id;
      const existing = latestByOther.get(otherId);
      if (!existing || existing.created_at < message.created_at) {
        latestByOther.set(otherId, message);
      }
    }

    return Array.from(latestByOther.entries())
      .map(([otherId, lastMessage]) => {
        const other = state.users.get(otherId);
        if (!other) return null;
        return {
          user: publicUserSummary(other),
          lastMessage: normalizeDirectMessage(lastMessage),
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.lastMessage.createdAt < b.lastMessage.createdAt ? 1 : -1))
      .slice(0, limit);
  }

  const { rows } = await query(
    `SELECT DISTINCT ON (other_id)
        other_id,
        u.display_name,
        u.role,
        dm.id,
        dm.sender_id,
        dm.recipient_id,
        dm.message,
        dm.is_read,
        dm.created_at
     FROM (
        SELECT *,
          CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END AS other_id
        FROM direct_messages
        WHERE sender_id = $1 OR recipient_id = $1
        ORDER BY created_at DESC
     ) dm
     JOIN users u ON u.id = dm.other_id
     ORDER BY other_id, dm.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return rows.map((row) => ({
    user: { id: row.other_id, displayName: row.display_name, role: row.role },
    lastMessage: normalizeDirectMessage(row),
  }));
}

module.exports = {
  listConversations,
  listDirectMessages,
  sendDirectMessage,
};

