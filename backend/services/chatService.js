const { hasDatabase } = require('../config/db');
const { notFound, serviceUnavailable } = require('../utils/errors');
const { getMemoryState, randomId } = require('./memoryStore');

function normalizePublicUser(user) {
  return {
    id: user.id,
    displayName: user.display_name,
    role: user.role,
    avatarUrl: user.avatar_url || null,
  };
}

function normalizeMessage(message) {
  return {
    id: message.id,
    senderId: message.sender_id,
    recipientId: message.recipient_id,
    message: message.message,
    createdAt: message.created_at,
  };
}

function conversationKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function resolveUserIdOrThrow(identifier) {
  const state = getMemoryState();

  if (state.users.has(identifier)) {
    return identifier;
  }

  const performer = state.performerDirectory.find((item) => item.id === identifier || item.slug === identifier);
  if (performer && state.users.has(performer.id)) {
    return performer.id;
  }

  throw notFound('User not found');
}

function ensureChatState(state) {
  if (!state.chatMessages) state.chatMessages = [];
  if (!state.chatReadAt) state.chatReadAt = new Map();
}

async function listConversations(userId, { limit = 25 } = {}) {
  if (hasDatabase()) {
    throw serviceUnavailable('Chat is not enabled for database mode yet');
  }

  const state = getMemoryState();
  ensureChatState(state);

  const conversations = new Map();

  for (const message of state.chatMessages) {
    if (message.sender_id !== userId && message.recipient_id !== userId) continue;
    const otherId = message.sender_id === userId ? message.recipient_id : message.sender_id;
    const key = conversationKey(userId, otherId);
    const existing = conversations.get(key);
    if (!existing || new Date(message.created_at).getTime() > new Date(existing.lastMessage.created_at).getTime()) {
      conversations.set(key, { otherId, lastMessage: message });
    }
  }

  const results = [];
  for (const { otherId, lastMessage } of conversations.values()) {
    const otherUser = state.users.get(otherId);
    if (!otherUser) continue;

    const readKey = `${userId}:${otherId}`;
    const readAt = state.chatReadAt.get(readKey) || null;
    const unreadCount = state.chatMessages.filter(
      (message) =>
        message.sender_id === otherId &&
        message.recipient_id === userId &&
        (!readAt || new Date(message.created_at).getTime() > new Date(readAt).getTime())
    ).length;

    results.push({
      user: normalizePublicUser(otherUser),
      lastMessage: normalizeMessage(lastMessage),
      lastMessageAt: lastMessage.created_at,
      unreadCount,
    });
  }

  results.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  return results.slice(0, Math.max(1, Math.min(100, Number(limit) || 25)));
}

async function listMessagesWithUser(userId, otherIdentifier, { limit = 50 } = {}) {
  if (hasDatabase()) {
    throw serviceUnavailable('Chat is not enabled for database mode yet');
  }

  const otherId = resolveUserIdOrThrow(otherIdentifier);
  const state = getMemoryState();
  ensureChatState(state);

  const messages = state.chatMessages
    .filter(
      (message) =>
        (message.sender_id === userId && message.recipient_id === otherId) ||
        (message.sender_id === otherId && message.recipient_id === userId)
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const safeLimit = Math.max(1, Math.min(250, Number(limit) || 50));
  const sliced = messages.length > safeLimit ? messages.slice(messages.length - safeLimit) : messages;

  state.chatReadAt.set(`${userId}:${otherId}`, new Date().toISOString());

  return {
    user: normalizePublicUser(state.users.get(otherId)),
    messages: sliced.map(normalizeMessage),
  };
}

async function sendChatMessage({ senderId, recipientId, message }) {
  if (hasDatabase()) {
    throw serviceUnavailable('Chat is not enabled for database mode yet');
  }

  const resolvedRecipientId = resolveUserIdOrThrow(recipientId);
  const state = getMemoryState();
  ensureChatState(state);

  const createdAt = new Date().toISOString();
  const record = {
    id: randomId(),
    sender_id: senderId,
    recipient_id: resolvedRecipientId,
    message: message.trim(),
    created_at: createdAt,
  };

  state.chatMessages.push(record);
  return {
    message: normalizeMessage(record),
  };
}

module.exports = {
  listConversations,
  listMessagesWithUser,
  sendChatMessage,
  normalizeMessage,
};

