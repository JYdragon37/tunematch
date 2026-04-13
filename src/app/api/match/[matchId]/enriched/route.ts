import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const COUNTRY_FLAGS: Record<string, string> = {
  KR: "🇰🇷", US: "🇺🇸", JP: "🇯🇵", GB: "🇬🇧", DE: "🇩🇪",
  FR: "🇫🇷", CA: "🇨🇦", AU: "🇦🇺", CN: "🇨🇳", IN: "🇮🇳",
  TW: "🇹🇼", SG: "🇸🇬", HK: "🇭🇰", BR: "🇧🇷", MX: "🇲🇽",
};

const CATEGORY_LABELS: Record<string, string> = {
  entertainment: "엔터/게임", knowledge: "지식/교육", humor: "유머/밈",
  lifestyle: "라이프스타일", music: "음악", news: "뉴스/시사",
  food: "음식/요리", tech: "테크",
};

// 국가 라벨에서 앞의 이모지+공백 제거 ("🇰🇷 한국" → "한국")
function cleanLabel(label: string): string {
  if (!label) return label;
  const parts = label.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ").trim() : label;
}

// 구독 날짜 기반 "진짜 취향" vs "최근 관심사" 계산
function computeRealTaste(channelsJson: string | null): { longTerm: string | null; recent: string | null } | null {
  if (!channelsJson) return null;
  let channels: any[] = [];
  try { channels = JSON.parse(channelsJson); } catch { return null; }
  if (channels.length === 0) return null;

  const now = new Date();
  const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
  const oneYearAgo  = new Date(now.getTime() - 1 * 365 * 24 * 60 * 60 * 1000);

  const old    = channels.filter(c => c.subscribedAt && new Date(c.subscribedAt) < twoYearsAgo);
  const recent = channels.filter(c => c.subscribedAt && new Date(c.subscribedAt) > oneYearAgo);

  function topCat(chs: any[]): string | null {
    if (!chs.length) return null;
    const counts: Record<string, number> = {};
    for (const c of chs) counts[c.customCategory ?? "entertainment"] = (counts[c.customCategory ?? "entertainment"] ?? 0) + 1;
    return (Object.entries(counts) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  const deep   = topCat(old);
  const recent_ = topCat(recent);
  if (!deep && !recent_) return null;

  return {
    longTerm: deep    ? (CATEGORY_LABELS[deep]    ?? deep)    : null,
    recent:   recent_ ? (CATEGORY_LABELS[recent_] ?? recent_) : null,
  };
}

// 좋아요 카테고리 벡터 코사인 유사도 (0-100)
function likedSyncScore(aCats: any[], bCats: any[]): number {
  if (!aCats.length || !bCats.length) return 0;
  const aVec: Record<string, number> = {};
  const bVec: Record<string, number> = {};
  for (const c of aCats) aVec[c.category] = (c.percent ?? 0) / 100;
  for (const c of bCats) bVec[c.category] = (c.percent ?? 0) / 100;

  const catSet: Record<string, boolean> = {};
  Object.keys(aVec).forEach(k => { catSet[k] = true; });
  Object.keys(bVec).forEach(k => { catSet[k] = true; });
  const cats = Object.keys(catSet);
  let dot = 0, magA = 0, magB = 0;
  for (const cat of cats) {
    const a = aVec[cat] ?? 0;
    const b = bVec[cat] ?? 0;
    dot += a * b; magA += a * a; magB += b * b;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom > 0 ? Math.round((dot / denom) * 100) : 0;
}

export async function GET(req: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const matchId = params.matchId;

    // 세션에서 channels_a, channels_b, b_solo_result 조회
    const { data: session } = await supabaseAdmin
      .from("match_sessions")
      .select("channels_a, channels_b, b_solo_result")
      .eq("id", matchId)
      .single();

    // A의 솔로 결과 (channelStatsData, likedVideoInsight 포함)
    const { data: aRows } = await supabaseAdmin
      .from("match_results")
      .select("channel_stats_data, liked_video_insight")
      .eq("match_session_id", matchId)
      .not("taste_type", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    const aSolo = aRows?.[0] ?? null;
    const bSolo = session?.b_solo_result ?? null;

    // ── Feature 3: 국가 다양성 비교 ──
    const aCountry = aSolo?.channel_stats_data?.countryDist ?? null;
    const bCountry = bSolo?.channelStatsData?.countryDist ?? null;

    const countryDiversity = (aCountry?.length || bCountry?.length) ? {
      userA: (aCountry ?? []).slice(0, 3).map((d: any) => ({
        flag: COUNTRY_FLAGS[d.code] ?? "🌐",
        label: cleanLabel(d.label ?? d.code),
        percent: d.percent,
      })),
      userB: (bCountry ?? []).slice(0, 3).map((d: any) => ({
        flag: COUNTRY_FLAGS[d.code] ?? "🌐",
        label: cleanLabel(d.label ?? d.code),
        percent: d.percent,
      })),
    } : null;

    // ── Feature 6: 진짜 취향 vs 최근 관심사 ──
    const realTasteA = computeRealTaste(session?.channels_a ?? null);
    const realTasteB = computeRealTaste(session?.channels_b ?? null);
    const realTaste = (realTasteA || realTasteB) ? { userA: realTasteA, userB: realTasteB } : null;

    // ── Features 8 & 11: 좋아요 비교 ──
    const aLiked = aSolo?.liked_video_insight ?? null;
    const bLiked = bSolo?.likedVideoInsight ?? null;

    let likedComparison = null;
    if (aLiked || bLiked) {
      const aTop = aLiked?.top10LikedCategories ?? [];
      const bTop = bLiked?.top10LikedCategories ?? [];

      // Feature 8: 두 사람 모두 좋아요 top4에 있는 카테고리
      const aTop4 = aTop.slice(0, 4).map((c: any) => c.category as string);
      const bTop4Set: Record<string, boolean> = {};
      bTop.slice(0, 4).forEach((c: any) => { bTop4Set[c.category] = true; });
      const hiddenCommonCategories = aTop4.filter((cat: string) => bTop4Set[cat]);

      likedComparison = {
        syncScore: likedSyncScore(aTop, bTop),
        hiddenCommonCategories,
        userATopCategories: aTop.slice(0, 4).map((c: any) => ({
          category: c.category,
          label: CATEGORY_LABELS[c.category] ?? c.label ?? c.category,
          percent: c.percent,
        })),
        userBTopCategories: bTop.slice(0, 4).map((c: any) => ({
          category: c.category,
          label: CATEGORY_LABELS[c.category] ?? c.label ?? c.category,
          percent: c.percent,
        })),
      };
    }

    return NextResponse.json({ countryDiversity, realTaste, likedComparison });
  } catch (error) {
    console.error("[enriched error]", error);
    return NextResponse.json({ countryDiversity: null, realTaste: null, likedComparison: null });
  }
}
