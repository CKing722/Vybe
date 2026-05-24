const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { GIFT_TYPES } = require('./giftCatalog');

const MEMORY_IDS = {
  viewer: '11111111-1111-4111-8111-111111111111',
  performer: '22222222-2222-4222-8222-222222222222',
  room: '33333333-3333-4333-8333-333333333333',
};

function nowIso() {
  return new Date().toISOString();
}

function createInitialState() {
  const demoPasswordHash = bcrypt.hashSync('vybe-demo', 4);

  return {
    users: new Map([
      [
        MEMORY_IDS.viewer,
        {
          id: MEMORY_IDS.viewer,
          email: 'viewer@vybe.local',
          password_hash: demoPasswordHash,
          display_name: 'VelvetKing',
          role: 'viewer',
          is_active: true,
          created_at: nowIso(),
        },
      ],
      [
        MEMORY_IDS.performer,
        {
          id: MEMORY_IDS.performer,
          email: 'luna@vybe.local',
          password_hash: demoPasswordHash,
          display_name: 'Luna Voss',
          role: 'performer',
          is_active: true,
          created_at: nowIso(),
        },
      ],
    ]),
    viewerProfiles: new Map([
      [
        MEMORY_IDS.viewer,
        {
          user_id: MEMORY_IDS.viewer,
          sparks: 10000,
          total_spent: 0,
          games_played: 0,
          games_won: 0,
          sparks_earned: 0,
          total_sessions: 0,
        },
      ],
    ]),
    performerProfiles: new Map([
      [
        MEMORY_IDS.performer,
        {
          user_id: MEMORY_IDS.performer,
          stage_name: 'Luna Voss',
          is_live: true,
          accent_color: '#ff2d78',
        },
      ],
    ]),
    giftTypes: GIFT_TYPES.map((gift) => ({ ...gift })),
    giftsSent: [],
    sparkTransactions: [],
    banners: [],
    viewerPerformerHistory: new Map(),
  };
}

let state = createInitialState();

function getMemoryState() {
  return state;
}

function resetMemoryStore() {
  state = createInitialState();
  return state;
}

function snapshotMemoryStore() {
  return {
    users: Array.from(state.users.values()),
    viewerProfiles: Array.from(state.viewerProfiles.values()),
    giftsSent: [...state.giftsSent],
    sparkTransactions: [...state.sparkTransactions],
    banners: [...state.banners],
  };
}

function randomId() {
  return crypto.randomUUID();
}

module.exports = {
  MEMORY_IDS,
  getMemoryState,
  randomId,
  resetMemoryStore,
  snapshotMemoryStore,
};
