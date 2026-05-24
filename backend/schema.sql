-- VYBE Database Schema — PostgreSQL
-- 80/20 split, earned loyalty, persistent identity, co-creation platform

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══ USERS (viewers + performers share base table) ═══
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt
  display_name VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('viewer', 'performer', 'admin')),
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE, -- age verified (Yoti for viewers, 2257 for performers)
  is_active BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ VIEWER IDENTITY — "You Are Known" ═══
CREATE TABLE viewer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sparks INTEGER DEFAULT 0 CHECK (sparks >= 0),
  total_spent DECIMAL(12,2) DEFAULT 0, -- lifetime USD spend (determines loyalty tier)
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  top_streak INTEGER DEFAULT 0,
  sparks_earned INTEGER DEFAULT 0, -- from games/sparkback
  total_sessions INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0, -- community standing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE viewer_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_key VARCHAR(50) NOT NULL, -- 'first_win', '5_streak', 'centurion', etc.
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

CREATE TABLE viewer_performer_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  performer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sessions_count INTEGER DEFAULT 0,
  sparks_spent INTEGER DEFAULT 0,
  first_interaction TIMESTAMPTZ DEFAULT NOW(),
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  is_subscribed BOOLEAN DEFAULT FALSE,
  subscription_started TIMESTAMPTZ,
  UNIQUE(viewer_id, performer_id)
);

-- ═══ PERFORMER PROFILES ═══
CREATE TABLE performer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stage_name VARCHAR(50),
  vibe VARCHAR(255), -- tagline
  accent_color VARCHAR(7) DEFAULT '#ff2d78',
  subscription_price DECIMAL(6,2), -- performer sets this ($4.99-$49.99)
  trial_days INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_hours_live DECIMAL(10,2) DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT FALSE,
  last_live_at TIMESTAMPTZ,
  max_session_minutes INTEGER DEFAULT 60,
  payout_method VARCHAR(50), -- ccbill, segpay
  payout_account_id VARCHAR(255),
  -- 2257 compliance
  id_verified BOOLEAN DEFAULT FALSE,
  model_release_signed BOOLEAN DEFAULT FALSE,
  tax_docs_filed BOOLEAN DEFAULT FALSE,
  custodian_record_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE performer_capabilities (
  performer_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  duo_available BOOLEAN DEFAULT FALSE,
  toys_enabled BOOLEAN DEFAULT FALSE,
  replay_allowed BOOLEAN DEFAULT FALSE,
  wardrobe_available BOOLEAN DEFAULT FALSE,
  game_modes JSONB DEFAULT '[]'::jsonb -- array of enabled game mode IDs
);

CREATE TABLE performer_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  performer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/New_York'
);

-- ═══ SPARK ECONOMY ═══
CREATE TABLE spark_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'purchase', 'gift_sent', 'gift_received', 'session_payment',
    'session_earned', 'request_payment', 'request_earned',
    'sparkback', 'game_reward', 'subscription_payment',
    'subscription_earned', 'content_purchase', 'content_earned',
    'presence_points', 'spark_storm_reward', 'refund'
  )),
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  balance_after INTEGER NOT NULL,
  reference_id UUID, -- links to gift/session/request/etc
  performer_id UUID REFERENCES users(id), -- who received (for gifts/sessions)
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE spark_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  sparks_amount INTEGER NOT NULL,
  bonus_sparks INTEGER DEFAULT 0,
  usd_amount DECIMAL(8,2) NOT NULL,
  payment_processor VARCHAR(20), -- ccbill, segpay, epoch
  processor_txn_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ GIFTS ═══
CREATE TABLE gift_types (
  id VARCHAR(20) PRIMARY KEY, -- 'rose', 'flame', etc.
  name VARCHAR(50) NOT NULL,
  cost INTEGER NOT NULL,
  icon VARCHAR(30) NOT NULL,
  color VARCHAR(7) NOT NULL,
  animation_type VARCHAR(30), -- 'bloom', 'trail', 'rain', 'descend', 'burst', 'cinematic'
  animation_duration_ms INTEGER DEFAULT 2000,
  is_platform_banner BOOLEAN DEFAULT FALSE, -- shows across entire platform
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE gifts_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id),
  performer_id UUID REFERENCES users(id),
  gift_type_id VARCHAR(20) REFERENCES gift_types(id),
  spark_cost INTEGER NOT NULL,
  performer_earnings INTEGER NOT NULL, -- cost * 0.80
  platform_fee INTEGER NOT NULL, -- cost * 0.20
  room_id UUID, -- which live room
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ SESSIONS ═══
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID REFERENCES users(id),
  performer_id UUID REFERENCES users(id),
  session_type VARCHAR(20) CHECK (session_type IN ('live_free', 'booked', 'vip')),
  duration_minutes INTEGER,
  sparks_cost INTEGER DEFAULT 0,
  performer_earnings INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB -- game modes played, add-ons, etc.
);

-- ═══ REQUESTS ═══
CREATE TABLE performer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  performer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  spark_cost INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE request_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID REFERENCES users(id),
  performer_id UUID REFERENCES users(id),
  request_id UUID REFERENCES performer_requests(id),
  spark_cost INTEGER NOT NULL,
  performer_earnings INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ SUBSCRIPTIONS ═══
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscriber_id UUID REFERENCES users(id),
  performer_id UUID REFERENCES users(id),
  price_usd DECIMAL(6,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  streak_months INTEGER DEFAULT 0,
  processor_sub_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(subscriber_id, performer_id)
);

-- ═══ CONTENT ═══
CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  performer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('text', 'photo', 'video', 'audio')),
  text_content TEXT,
  media_url TEXT,
  media_thumbnail_url TEXT,
  is_subscriber_only BOOLEAN DEFAULT FALSE,
  spark_price INTEGER DEFAULT 0, -- 0 = free, >0 = paid per-view
  is_ephemeral BOOLEAN DEFAULT FALSE, -- Stories/Moments
  expires_at TIMESTAMPTZ, -- for ephemeral content
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID REFERENCES users(id),
  content_id UUID REFERENCES content_posts(id),
  sparks_paid INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(viewer_id, content_id)
);

-- ═══ CHAT ═══
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL, -- performer's live room ID
  sender_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'gift', 'request', 'system', 'spark_storm')),
  metadata JSONB, -- gift info, request info, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ GAMES ═══
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL,
  game_type VARCHAR(20) NOT NULL, -- trivia, spin, truth, etc.
  performer_id UUID REFERENCES users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB -- round data, winners, etc.
);

CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_session_id UUID REFERENCES game_sessions(id),
  viewer_id UUID REFERENCES users(id),
  score INTEGER DEFAULT 0,
  sparks_earned INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ COMMUNITY ═══
CREATE TABLE spark_storms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL,
  performer_id UUID REFERENCES users(id),
  trigger_count INTEGER NOT NULL, -- gifts that triggered it
  target_sparks INTEGER NOT NULL, -- goal to fill meter
  current_sparks INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL, -- 3-minute timer
  reward_sparks INTEGER DEFAULT 0 -- per participant
);

CREATE TABLE platform_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(30) NOT NULL, -- 'gift', 'spark_storm', 'milestone'
  sender_name VARCHAR(50),
  performer_name VARCHAR(50),
  performer_id UUID REFERENCES users(id),
  gift_name VARCHAR(50),
  spark_amount INTEGER,
  expires_at TIMESTAMPTZ NOT NULL, -- banners auto-expire
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE presence_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID REFERENCES users(id),
  performer_id UUID REFERENCES users(id),
  points INTEGER NOT NULL,
  source VARCHAR(30), -- 'watching', 'chat_active', 'game_participation'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ INDEXES ═══
CREATE INDEX idx_spark_txn_user ON spark_transactions(user_id, created_at DESC);
CREATE INDEX idx_spark_txn_performer ON spark_transactions(performer_id, created_at DESC);
CREATE INDEX idx_gifts_performer ON gifts_sent(performer_id, created_at DESC);
CREATE INDEX idx_sessions_viewer ON sessions(viewer_id, created_at DESC);
CREATE INDEX idx_sessions_performer ON sessions(performer_id, created_at DESC);
CREATE INDEX idx_content_performer ON content_posts(performer_id, created_at DESC);
CREATE INDEX idx_chat_room ON chat_messages(room_id, created_at DESC);
CREATE INDEX idx_dm_recipient ON direct_messages(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_subs_performer ON subscriptions(performer_id, status);
CREATE INDEX idx_viewer_history ON viewer_performer_history(viewer_id);
CREATE INDEX idx_banners_expires_at ON platform_banners(expires_at);
CREATE INDEX idx_banners_type_created ON platform_banners(type, created_at DESC);
CREATE INDEX idx_perf_live ON performer_profiles(is_live) WHERE is_live = TRUE;

-- ═══ SEED: Gift Types ═══
INSERT INTO gift_types (id, name, cost, icon, color, animation_type, animation_duration_ms, is_platform_banner, sort_order) VALUES
  ('rose', 'Neon Rose', 5, 'rose', '#ff2d78', 'bloom', 1500, FALSE, 1),
  ('flame', 'Fire Shot', 25, 'flame', '#f97316', 'trail', 2000, FALSE, 2),
  ('kiss', 'Blow Kiss', 50, 'lips', '#f472b6', 'float', 2500, FALSE, 3),
  ('diamond', 'Diamond Rain', 150, 'diamond', '#00d4ff', 'rain', 4000, FALSE, 4),
  ('crown', 'Crown Drop', 500, 'crown', '#fbbf24', 'descend', 6000, TRUE, 5),
  ('champagne', 'Champagne', 2500, 'champagne', '#c6ff00', 'burst', 8000, TRUE, 6),
  ('key', 'Private Key', 5000, 'key', '#8b5cf6', 'cinematic', 15000, TRUE, 7);

-- ═══ SEED: Achievement Definitions ═══
CREATE TABLE achievement_definitions (
  key VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(30),
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'))
);

INSERT INTO achievement_definitions (key, name, description, icon, rarity) VALUES
  ('first_win', 'First Blood', 'Win your first game', 'trophy', 'common'),
  ('streak_5', '5-Game Streak', 'Win 5 games in a row', 'streak', 'uncommon'),
  ('centurion', 'Centurion', 'Play 100 games', 'badge', 'uncommon'),
  ('jackpot', 'All In', 'Win the All-In Jackpot', 'star', 'rare'),
  ('crown_sender', 'Crown Sender', 'Send a Crown Drop gift', 'crown', 'rare'),
  ('diamond_tier', 'Diamond Hands', 'Reach Diamond loyalty tier', 'diamond', 'epic'),
  ('top_fan', 'Number One', '#1 on a performer all-time leaderboard', 'kinghill', 'legendary'),
  ('thousand_games', 'Veteran', 'Play 1,000 games', 'gamepad', 'epic'),
  ('spark_storm', 'Storm Chaser', 'Participate in 10 Spark Storms', 'streak', 'uncommon'),
  ('multi_perf', 'Explorer', 'Subscribe to 5 different performers', 'users', 'rare');
