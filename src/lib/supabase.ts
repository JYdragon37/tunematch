import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "placeholder";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder";

// Next.js 14는 fetch를 기본 캐싱함 → Supabase 쿼리가 stale 데이터를 반환하는 원인
// cache: 'no-store'로 모든 Supabase fetch가 캐시를 우회하도록 설정
const noStoreConfig = {
  global: {
    fetch: (url: RequestInfo | URL, init?: RequestInit) =>
      fetch(url, { ...init, cache: "no-store" }),
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, noStoreConfig);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, noStoreConfig);
