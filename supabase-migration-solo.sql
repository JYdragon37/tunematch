-- TuneMatch: 솔로 취향 분석 컬럼 추가 마이그레이션
-- Supabase SQL Editor에서 실행

ALTER TABLE match_results ADD COLUMN IF NOT EXISTS taste_type TEXT;
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS diversity_index INTEGER;
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS friend_type TEXT;
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS friend_type_reason TEXT;
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS top_categories JSONB;
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS channel_count INTEGER;
