import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// rowToResult 인라인 (db.ts 추상 함수 Vercel 환경 불안정 우회)
function toResult(row: any) {
  return {
    id: row.id,
    matchSessionId: row.match_session_id,
    userAName: row.user_a_name,
    userBName: row.user_b_name,
    totalScore: row.total_score,
    channelScore: row.channel_score,
    categoryScore: row.category_score,
    curiosityScore: row.curiosity_score,
    humorScore: row.humor_score,
    patternScore: row.pattern_score,
    comment: row.comment,
    commentType: row.comment_type,
    commonChannels: row.common_channels || [],
    recommendations: row.recommendations || [],
    userAVector: row.user_a_vector || {},
    userBVector: row.user_b_vector || {},
    tasteType: row.taste_type ?? undefined,
    diversityIndex: row.diversity_index ?? undefined,
    friendType: row.friend_type ?? undefined,
    friendTypeReason: row.friend_type_reason ?? undefined,
    topCategories: row.top_categories ?? undefined,
    channelCount: row.channel_count ?? undefined,
    channelStatsData: row.channel_stats_data ?? undefined,
    likedVideoInsight: row.liked_video_insight ?? undefined,
    curatedRecs: row.curated_recs ?? undefined,
    comparisonData: row.comparison_data ?? undefined,
    createdAt: row.created_at,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const matchId = params.matchId;

  // 1. match_sessions 직접 조회
  const { data: sessionRow, error: sessErr } = await supabaseAdmin
    .from("match_sessions")
    .select("id, status, result_id, user_a_name, user_b_name")
    .eq("id", matchId)
    .single();

  if (sessErr || !sessionRow) {
    return NextResponse.json({ error: "세션 없음" }, { status: 404 });
  }

  // 2. result_id가 있으면 → compare 완료. 해당 결과 직접 조회
  if (sessionRow.result_id) {
    const { data: resultRow } = await supabaseAdmin
      .from("match_results")
      .select()
      .eq("id", sessionRow.result_id)
      .single();

    if (resultRow && !resultRow.taste_type) {
      return NextResponse.json({ status: "done", sessionStatus: "done", result: toResult(resultRow) });
    }
  }

  // 3. match_results에서 비교 결과 탐색
  const { data: allResults } = await supabaseAdmin
    .from("match_results")
    .select()
    .eq("match_session_id", matchId)
    .order("created_at", { ascending: false });

  if (allResults && allResults.length > 0) {
    const comp = allResults.find((r: any) => !r.taste_type && r.user_b_name !== "나의 취향 분석");
    if (comp) {
      return NextResponse.json({ status: "done", sessionStatus: "done", result: toResult(comp) });
    }

    // 솔로 결과만 있는 경우
    const solo = allResults[0];
    const status = sessionRow.status;
    if (status === "done") {
      return NextResponse.json({ status: "analyzing", sessionStatus: "done", result: null });
    }
    return NextResponse.json({ status: "solo_done", sessionStatus: status, result: toResult(solo) });
  }

  // 4. 결과 없음
  return NextResponse.json({ status: sessionRow.status, sessionStatus: sessionRow.status, result: null });
}
