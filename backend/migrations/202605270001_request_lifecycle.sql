ALTER TABLE request_purchases
  ADD COLUMN IF NOT EXISTS requester_display_name VARCHAR(50),
  ADD COLUMN IF NOT EXISTS request_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS request_description TEXT,
  ADD COLUMN IF NOT EXISTS prompt TEXT,
  ADD COLUMN IF NOT EXISTS escrow_sparks INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchased_sparks_spent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_sparks_spent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS public_visible BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE request_purchases
  DROP CONSTRAINT IF EXISTS request_purchases_status_check;

ALTER TABLE request_purchases
  ADD CONSTRAINT request_purchases_status_check
  CHECK (status IN ('pending', 'accepted', 'completed', 'declined', 'expired', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_request_purchases_viewer
  ON request_purchases(viewer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_purchases_performer_status
  ON request_purchases(performer_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_purchases_public
  ON request_purchases(performer_id, public_visible, accepted_at DESC)
  WHERE public_visible = TRUE;
