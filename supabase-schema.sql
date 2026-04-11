-- TuneMatch Supabase Schema
-- Supabase 프로젝트 생성 후 SQL Editor에서 실행

-- match_sessions 테이블
CREATE TABLE IF NOT EXISTS match_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL,
  user_a_name TEXT NOT NULL,
  user_b_id UUID,
  user_b_name TEXT,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'analyzing', 'done', 'expired')),
  notify_email TEXT NOT NULL,
  result_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- match_results 테이블
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_session_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
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

-- saved_results 테이블 (선택적 로그인 유저용)
CREATE TABLE IF NOT EXISTS saved_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  match_result_id UUID NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, match_result_id)
);

-- RLS 정책
ALTER TABLE match_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_results ENABLE ROW LEVEL SECURITY;

-- match_sessions: 서비스 롤만 전체 접근 (anon은 matchId로 조회만)
CREATE POLICY "Public read by id" ON match_sessions
  FOR SELECT USING (true);

CREATE POLICY "Service role insert" ON match_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role update" ON match_sessions
  FOR UPDATE USING (true);

-- match_results: 공개 읽기
CREATE POLICY "Public read" ON match_results
  FOR SELECT USING (true);

CREATE POLICY "Service role insert" ON match_results
  FOR INSERT WITH CHECK (true);

-- saved_results: 본인 것만 접근
CREATE POLICY "Own results only" ON saved_results
  USING (user_id = auth.uid());

-- 만료된 세션 자동 업데이트 함수 (cron job으로 활용)
CREATE OR REPLACE FUNCTION expire_old_sessions()
RETURNS void AS $$
  UPDATE match_sessions
  SET status = 'expired'
  WHERE status = 'waiting'
    AND expires_at < NOW();
$$ LANGUAGE SQL;

-- Realtime 활성화 (B 연동 완료 시 A 화면 자동 업데이트용)
ALTER PUBLICATION supabase_realtime ADD TABLE match_sessions;
