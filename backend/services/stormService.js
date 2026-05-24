const { randomId } = require('./memoryStore');

const WINDOW_MS = 60 * 1000;
const STORM_DURATION_MS = 3 * 60 * 1000;
const TRIGGER_COUNT = 5;

const roomWindows = new Map();
const activeStorms = new Map();

function pruneWindow(gifts, now) {
  return gifts.filter((gift) => now - gift.at <= WINDOW_MS);
}

function recordGiftForStorm({ roomId, performerId, senderId, sparkCost }) {
  if (!roomId) return [];

  const now = Date.now();
  const gifts = pruneWindow(roomWindows.get(roomId) || [], now);
  gifts.push({ senderId, sparkCost, at: now });
  roomWindows.set(roomId, gifts);

  const events = [];
  let storm = activeStorms.get(roomId);

  if (!storm && gifts.length >= TRIGGER_COUNT) {
    const initialSparks = gifts.reduce((sum, gift) => sum + gift.sparkCost, 0);
    storm = {
      id: randomId(),
      roomId,
      performerId,
      targetSparks: Math.max(1000, initialSparks * 3),
      currentSparks: initialSparks,
      level: 1,
      participants: new Set(gifts.map((gift) => gift.senderId)),
      startedAt: new Date(now).toISOString(),
      endsAt: new Date(now + STORM_DURATION_MS).toISOString(),
    };
    activeStorms.set(roomId, storm);
    events.push({
      type: 'spark_storm_start',
      payload: {
        stormId: storm.id,
        roomId,
        performerId,
        target: storm.targetSparks,
        current: storm.currentSparks,
        timerMs: STORM_DURATION_MS,
        level: storm.level,
      },
    });
  } else if (storm) {
    storm.currentSparks += sparkCost;
    storm.participants.add(senderId);
    storm.level = Math.min(5, Math.floor(storm.currentSparks / storm.targetSparks) + 1);
  }

  if (storm) {
    events.push({
      type: 'spark_storm_update',
      payload: {
        stormId: storm.id,
        roomId,
        current: storm.currentSparks,
        target: storm.targetSparks,
        level: storm.level,
        participantCount: storm.participants.size,
      },
    });

    if (storm.currentSparks >= storm.targetSparks) {
      activeStorms.delete(roomId);
      events.push({
        type: 'spark_storm_complete',
        payload: {
          stormId: storm.id,
          roomId,
          rewardPerParticipant: Math.max(10, Math.floor(storm.targetSparks / 100)),
          participantCount: storm.participants.size,
        },
      });
    }
  }

  return events;
}

function resetStormState() {
  roomWindows.clear();
  activeStorms.clear();
}

module.exports = {
  recordGiftForStorm,
  resetStormState,
};
