ALTER TABLE users
  ADD COLUMN IF NOT EXISTS priority_weight INTEGER DEFAULT 1;

ALTER TABLE spark_transactions
  ADD COLUMN IF NOT EXISTS is_bonus BOOLEAN DEFAULT FALSE;

UPDATE spark_transactions
SET is_bonus = COALESCE(is_bonus, FALSE) OR COALESCE(bonus_spark, FALSE);

CREATE TABLE IF NOT EXISTS daily_login_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_date DATE NOT NULL,
  streak_count INTEGER NOT NULL DEFAULT 1,
  sparks_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reward_date)
);

CREATE TABLE IF NOT EXISTS concierge_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  concierge_user_id UUID REFERENCES users(id),
  tier_name VARCHAR(30) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performer_categories (
  performer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (performer_id, category)
);

CREATE INDEX IF NOT EXISTS idx_daily_login_rewards_user_date
  ON daily_login_rewards(user_id, reward_date DESC);

CREATE INDEX IF NOT EXISTS idx_concierge_assignments_viewer
  ON concierge_assignments(viewer_id, status);

CREATE INDEX IF NOT EXISTS idx_performer_categories_category
  ON performer_categories(category, performer_id);
