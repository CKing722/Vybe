const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { GIFT_TYPES } = require('./giftCatalog');

const MEMORY_IDS = {
  viewer: '11111111-1111-4111-8111-111111111111',
  performer: '22222222-2222-4222-8222-222222222222',
  room: '33333333-3333-4333-8333-333333333333',
};

const DEMO_PERFORMERS = [
  {
    id: MEMORY_IDS.performer,
    slug: 'luna',
    room_id: MEMORY_IDS.room,
    name: 'Luna Voss',
    stage_name: 'Luna Voss',
    vibe: 'Sultry game show host energy',
    viewers: 342,
    game: 'Tease Trivia',
    level: 'hot',
    tags: ['Interactive', 'Toys', 'HD'],
    accent: '#ff2d78',
    rating: 4.9,
    sessions: 1247,
    categories: ['Women', 'Interactive', 'HD', 'Trending'],
    caps: {
      duo: true,
      toys: true,
      replay: true,
      wardrobe: true,
      maxMins: 60,
      games: [
        'trivia',
        'spin',
        'truth',
        'hotseat',
        'clash',
        'auction',
        'king',
        'mystery',
        'ladder',
        'buzz',
        'jackpot',
      ],
    },
    bio: 'Your favorite late-night game host. Come ready to play or ready to lose.',
    subscription: { price: 29.99, trial: 7 },
    schedule: [
      { day: 'Mon', time: '9PM' },
      { day: 'Wed', time: '10PM' },
      { day: 'Fri', time: '9PM' },
      { day: 'Sat', time: '11PM' },
    ],
    stats: { hoursLive: 2840, followers: 12400 },
    requests: [
      { name: 'Song & Vibe', sparks: 150, desc: 'She plays your song' },
      { name: 'Outfit Choice', sparks: 250, desc: 'Pick her wardrobe' },
      { name: 'Personal Shoutout', sparks: 400, desc: 'Your name on camera' },
      { name: 'Custom Dare', sparks: 500, desc: 'You write the dare' },
      { name: 'Game Master', sparks: 750, desc: 'You control 5 min' },
      { name: 'Fantasy Intro', sparks: 1000, desc: 'Custom roleplay opening' },
      { name: 'Exclusive Content', sparks: 2000, desc: 'Custom set for you' },
      { name: 'Ultimate Fantasy', sparks: 5000, desc: 'You design it, she delivers' },
    ],
    posts: [
      { text: "Tonight's trivia: spicy confessions. Bring it.", time: '2h' },
      { text: 'New wardrobe drop. Subs get first look.', time: '1d' },
      { text: "5-game win streak. Who's dethroning me?", time: '3d' },
    ],
    is_live: true,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    slug: 'jade',
    room_id: '44444444-4444-4444-9444-444444444444',
    name: 'Jade Kincaid',
    stage_name: 'Jade Kincaid',
    vibe: 'Competitive trash-talk champion',
    viewers: 489,
    game: 'King of the Hill',
    level: 'finale',
    tags: ['Interactive', 'Trending'],
    accent: '#c6ff00',
    rating: 4.7,
    sessions: 2103,
    categories: ['Women', 'Interactive', 'Trending', 'Fetish'],
    caps: {
      duo: false,
      toys: false,
      replay: true,
      wardrobe: false,
      maxMins: 45,
      games: ['trivia', 'hotseat', 'clash', 'king', 'buzz', 'jackpot'],
    },
    bio: 'High-heat games, quick wit, and a leaderboard that never stays quiet.',
    subscription: { price: 14.99, trial: 0 },
    schedule: [
      { day: 'Mon', time: '10PM' },
      { day: 'Thu', time: '9PM' },
      { day: 'Sat', time: '11PM' },
    ],
    stats: { hoursLive: 4100, followers: 22000 },
    requests: [
      { name: 'Game Master', sparks: 500, desc: 'You pick the games' },
      { name: 'Custom Dare', sparks: 600, desc: 'Push her limits' },
    ],
    posts: [{ text: 'King of the Hill tournament tonight.', time: '1h' }],
    is_live: true,
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    slug: 'raven',
    room_id: '55555555-5555-4555-9555-555555555555',
    name: 'Raven Blackwell',
    stage_name: 'Raven Blackwell',
    vibe: 'Dark mystery and dare master',
    viewers: 267,
    game: 'Dare Ladder',
    level: 'hot',
    tags: ['Fetish', 'Roleplay'],
    accent: '#8b5cf6',
    rating: 4.8,
    sessions: 987,
    categories: ['Women', 'Fetish', 'Roleplay', 'Toys'],
    caps: {
      duo: true,
      toys: true,
      replay: false,
      wardrobe: true,
      maxMins: 60,
      games: ['truth', 'mystery', 'ladder', 'spin', 'auction'],
    },
    bio: 'Slow-burn mystery, dare ladders, and rooms that feel like a private ritual.',
    subscription: { price: 24.99, trial: 7 },
    schedule: [
      { day: 'Tue', time: '11PM' },
      { day: 'Fri', time: '10PM' },
    ],
    stats: { hoursLive: 1800, followers: 9500 },
    requests: [
      { name: 'Fantasy Intro', sparks: 1200, desc: 'Dark roleplay' },
      { name: 'Exclusive Content', sparks: 2500, desc: 'Custom, your theme' },
      { name: 'Ultimate Fantasy', sparks: 5000, desc: 'Full immersion' },
    ],
    posts: [{ text: 'New dare deck unlocked. Subs only.', time: '5h' }],
    is_live: true,
  },
];

const LOYALTY_TIERS = [
  { name: 'Bronze', min: 0, sparkBack: 0, color: '#cd7f32' },
  { name: 'Silver', min: 200, sparkBack: 3, color: '#c0c0c0' },
  { name: 'Gold', min: 1000, sparkBack: 5, color: '#ffd700' },
  { name: 'Platinum', min: 5000, sparkBack: 8, color: '#e5e4e2' },
  { name: 'Diamond', min: 25000, sparkBack: 10, color: '#67e8f9' },
];

function bonusExpiryIso(days = 90) {
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + days);
  return expires.toISOString();
}

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
          age_verified: true,
          age_verification_provider: 'demo',
          age_verification_date: nowIso(),
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
          age_verified: true,
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
          purchased_sparks: 9000,
          bonus_sparks: 1000,
          bonus_sparks_expires_at: bonusExpiryIso(),
          total_spent: 0,
          games_played: 0,
          games_won: 0,
          sparks_earned: 0,
          total_sessions: 0,
          daily_login_streak: 0,
          priority_weight: 1,
          vip_membership_status: 'none',
        },
      ],
    ]),
    performerProfiles: new Map([
      ...DEMO_PERFORMERS.map((performer) => [
        performer.id,
        {
          user_id: performer.id,
          stage_name: performer.stage_name,
          vibe: performer.vibe,
          accent_color: performer.accent,
          subscription_price: performer.subscription.price,
          trial_days: performer.subscription.trial,
          rating: performer.rating,
          total_sessions: performer.sessions,
          total_hours_live: performer.stats.hoursLive,
          follower_count: performer.stats.followers,
          is_live: performer.is_live,
          max_session_minutes: performer.caps.maxMins,
          legal_name: performer.stage_name,
          stage_names: [performer.stage_name],
          verification_status: 'verified',
          verification_date: nowIso(),
          verification_ref: 'demo-2257-ref',
          contractor_agreement_signed: true,
          model_release_signed: true,
          w9_submitted: true,
          custodian_record_id: `demo-${performer.slug}`,
        },
      ]),
    ]),
    performerDirectory: DEMO_PERFORMERS.map((performer) => ({ ...performer })),
    giftTypes: GIFT_TYPES.map((gift) => ({ ...gift })),
    giftsSent: [],
    sparkPurchases: [],
    requestPurchases: [],
    sparkTransactions: [],
    banners: [],
    viewerPerformerHistory: new Map(),
    complianceEvents: [],
    paymentMethods: new Map(),
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
    performerDirectory: [...state.performerDirectory],
    giftsSent: [...state.giftsSent],
    sparkPurchases: [...state.sparkPurchases],
    requestPurchases: [...state.requestPurchases],
    sparkTransactions: [...state.sparkTransactions],
    banners: [...state.banners],
    complianceEvents: [...state.complianceEvents],
  };
}

function randomId() {
  return crypto.randomUUID();
}

module.exports = {
  DEMO_PERFORMERS,
  LOYALTY_TIERS,
  MEMORY_IDS,
  getMemoryState,
  randomId,
  resetMemoryStore,
  snapshotMemoryStore,
};
