import { NextRequest, NextResponse } from "next/server";
import { sendMessage, formatSoloResult } from "@/lib/telegram";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { resultId } = await req.json();

    const { data } = await supabaseAdmin
      .from("match_results")
      .select("*")
      .eq("id", resultId)
      .single();

    if (!data) return NextResponse.json({ error: "결과 없음" }, { status: 404 });

    const msg = formatSoloResult({
      userAName: data.user_a_name,
      tasteType: data.taste_type,
      commentType: data.comment_type,
      comment: data.comment,
      diversityIndex: data.diversity_index,
      channelCount: data.channel_count,
      topCategories: data.top_categories,
      channelStatsData: data.channel_stats_data,
      likedVideoInsight: data.liked_video_insight,
    });

    const ok = await sendMessage(msg);
    return NextResponse.json({ ok });
  } catch (err) {
    return NextResponse.json({ error: "전송 실패" }, { status: 500 });
  }
}
