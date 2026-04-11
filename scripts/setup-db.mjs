/**
 * Supabase DB 테이블 생성 스크립트
 * 실행: node scripts/setup-db.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local에서 직접 읽기
const envPath = join(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim().replace(/^["']|["']$/g, "")];
    })
);

const supabaseUrl = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  db: { schema: "public" },
});

const SQL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS match_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id TEXT NOT NULL,
    user_a_name TEXT NOT NULL,
    user_b_id TEXT,
    user_b_name TEXT,
    status TEXT NOT NULL DEFAULT 'waiting',
    notify_email TEXT NOT NULL,
    channels_a TEXT,
    result_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
  )`,

  `CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_session_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
    user_a_name TEXT NOT NULL DEFAULT '',
    user_b_name TEXT NOT NULL DEFAULT '',
    total_score INTEGER NOT NULL DEFAULT 0,
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
  )`,

  `CREATE TABLE IF NOT EXISTS saved_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    match_result_id UUID NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, match_result_id)
  )`,

  `ALTER TABLE match_sessions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE match_results ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE saved_results ENABLE ROW LEVEL SECURITY`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='match_sessions' AND policyname='Public read') THEN
      CREATE POLICY "Public read" ON match_sessions FOR SELECT USING (true);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='match_sessions' AND policyname='Service insert') THEN
      CREATE POLICY "Service insert" ON match_sessions FOR INSERT WITH CHECK (true);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='match_sessions' AND policyname='Service update') THEN
      CREATE POLICY "Service update" ON match_sessions FOR UPDATE USING (true);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='match_results' AND policyname='Public read') THEN
      CREATE POLICY "Public read" ON match_results FOR SELECT USING (true);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='match_results' AND policyname='Service insert') THEN
      CREATE POLICY "Service insert" ON match_results FOR INSERT WITH CHECK (true);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='saved_results' AND policyname='Own only') THEN
      CREATE POLICY "Own only" ON saved_results USING (true);
    END IF;
  END $$`,
];

async function setup() {
  console.log("🚀 Supabase DB 스키마 설정 시작...\n");

  for (const sql of SQL_STATEMENTS) {
    const preview = sql.trim().split("\n")[0].substring(0, 60);
    process.stdout.write(`  → ${preview}... `);

    const { error } = await supabase.rpc("exec_sql", { sql }).catch(() => ({ error: { message: "RPC not available" } }));

    if (error?.message?.includes("RPC not available") || error?.message?.includes("Could not find")) {
      // RPC 없음 → 직접 REST로 테이블 존재 확인
      console.log("(RPC 미지원 - 수동 설치 필요)");
      break;
    } else if (error) {
      console.log(`⚠️  ${error.message}`);
    } else {
      console.log("✓");
    }
  }

  // 테이블 존재 여부 확인
  console.log("\n📋 테이블 존재 확인:");
  for (const table of ["match_sessions", "match_results", "saved_results"]) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error && error.message.includes("does not exist")) {
      console.log(`  ❌ ${table} - 없음 (수동 생성 필요)`);
    } else {
      console.log(`  ✅ ${table} - 존재`);
    }
  }
}

setup().catch(console.error);
