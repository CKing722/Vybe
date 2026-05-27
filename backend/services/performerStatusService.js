const { hasDatabase } = require('../config/db');
const { getMemoryState } = require('./memoryStore');

function nowIso() {
  return new Date().toISOString();
}

async function getPerformerStatusForRoom(roomId) {
  if (!roomId) return null;

  if (hasDatabase()) {
    return null;
  }

  const performer = getMemoryState().performerDirectory.find(
    (item) => item.room_id === roomId || item.roomId === roomId
  );
  if (!performer) return null;

  return {
    performerId: performer.id,
    roomId,
    isLive: Boolean(performer.is_live),
    updatedAt: nowIso(),
  };
}

module.exports = { getPerformerStatusForRoom };

