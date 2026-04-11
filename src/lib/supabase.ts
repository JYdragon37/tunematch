import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://mock.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "mock-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-service-role-key";

// 클라이언트 사이드용 (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버 사이드용 (service role key - 클라이언트에 절대 노출 금지)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
