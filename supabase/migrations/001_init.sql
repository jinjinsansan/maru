-- ============================================
-- 〇❌パーティゲーム - 初期マイグレーション
-- ============================================

-- users テーブル
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  is_admin      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- invite_codes テーブル
CREATE TABLE invite_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,
  created_by  UUID REFERENCES users(id),
  used_by     UUID REFERENCES users(id) DEFAULT NULL,
  used_at     TIMESTAMPTZ DEFAULT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- game_sessions テーブル
CREATE TABLE game_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  chip_base       NUMERIC NOT NULL DEFAULT 1,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ DEFAULT NULL,
  total_profit    NUMERIC DEFAULT 0,
  o_count         INTEGER DEFAULT 0,
  x_count         INTEGER DEFAULT 0
);

-- sets テーブル
CREATE TABLE sets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  set_index           INTEGER NOT NULL,
  results             TEXT NOT NULL,
  wins                INTEGER NOT NULL,
  losses              INTEGER NOT NULL,
  overshoot           INTEGER NOT NULL,
  slashed             BOOLEAN DEFAULT FALSE,
  used_unit_idx       INTEGER NOT NULL,
  next_unit_idx       INTEGER NOT NULL,
  set_profit          NUMERIC NOT NULL,
  cumulative_profit   NUMERIC NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security
-- ============================================

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_read" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "self_update" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "self_insert" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_read" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- game_sessions
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_session_all" ON game_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_session_read" ON game_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- sets
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_sets_all" ON sets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM game_sessions WHERE id = session_id AND user_id = auth.uid())
  );

CREATE POLICY "admin_sets_read" ON sets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- invite_codes
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_invite_all" ON invite_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- 未認証ユーザーが招待コードを検証できるようにするポリシー
CREATE POLICY "anyone_can_verify_code" ON invite_codes
  FOR SELECT USING (TRUE);
