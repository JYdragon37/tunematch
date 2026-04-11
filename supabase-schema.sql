-- TuneMatch Supabase Schema
-- Supabase 대시보드 → SQL Editor에서 실행

-- match_sessions 테이블
CREATE TABLE IF NOT EXISTS match_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id TEXT NOT NULL,
  user_a_name TEXT NOT NULL,
  user_b_id TEXT,
  user_b_name TEXT,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'analyzing', 'done', 'expired')),
  notify_email TEXT NOT NULL,
  channels_a TEXT,          -- JSON stringified Channel[]
  result_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- match_results 테이블
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_session_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
  user_a_name TEXT NOT NULL DEFAULT '',
  user_b_name TEXT NOT NULL DEFAULT '',
  total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  channel_score INTEGER NOT NULL DEFAULT 0,
  category_score INTEGER NOT NULL DEFAULT 0,
  curiosity_score INTEGER NOT NULL DEFAULT 0,
  humor_score INTEGER NOT NULL DEFAULT 0,
  pattern_score INTEGER NOT NULL DEFAULT 0,
  comment TEXT,
  comment_type TEXT,
  common_channels JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  user_a_vector JSONB DEFAULT '{}',
  user_b_vector JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- saved_results 테이블
CREATE TABLE IF NOT EXISTS saved_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  match_result_id UUID NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, match_result_id)
);

-- RLS 정책
ALTER TABLE match_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON match_sessions FOR SELECT USING (true);
CREATE POLICY "Service insert" ON match_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update" ON match_sessions FOR UPDATE USING (true);

CREATE POLICY "Public read" ON match_results FOR SELECT USING (true);
CREATE POLICY "Service insert" ON match_results FOR INSERT WITH CHECK (true);

CREATE POLICY "Own only" ON saved_results USING (true);

-- Realtime (B 연동 완료 시 A 화면 자동 업데이트)
ALTER PUBLICATION supabase_realtime ADD TABLE match_sessions;
