import { NextRequest, NextResponse } from "next/server";
import { getSession, saveResult, updateSession } from "@/lib/db";
import { analyzeCompatibility } from "@/lib/algorithm";
import { sendEmail, buildNotificationEmail } from "@/lib/email";
import { mockRecommendedChannels } from "@/data/mock-channels";
import { supabaseAdmin } from "@/lib/supabase";
import type { Channel } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getSession(params.matchId);
    if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });
    const status = session.status as string;
    if (status === "done") return NextResponse.json({ error: "이미 완료" }, { status: 409 });
    if (status !== "b_joined") return NextResponse.json({ error: "B가 아직 연동하지 않았습니다" }, { status: 422 });

    // channels_a, channels_b 조회
    const { data: row, error: rowErr } = await supabaseAdmin
      .from("match_sessions")
      .select("channels_a, channels_b, user_b_name")
      .eq("id", params.matchId)
      .single();

    if (rowErr || !row) return NextResponse.json({ error: "세션 데이터 없음" }, { status: 500 });

    let channelsA: Channel[] = [];
    let channelsB: Channel[] = [];
    try { channelsA = JSON.parse(row.channels_a || "[]"); } catch {}
    try { channelsB = JSON.parse(row.channels_b || "[]"); } catch {}

    if (!channelsA.length || !channelsB.length) {
      return NextResponse.json({ error: "채널 데이터 없음" }, { status: 422 });
    }

    // A vs B 궁합 분석
    const result = analyzeCompatibility(
      params.matchId,
      session.userAName,
      row.user_b_name || "친구",
      channelsA,
      channelsB,
      mockRecommendedChannels
    );

    await saveResult(result);
    await updateSession(params.matchId, { status: "done", resultId: result.id });

    // A에게 결과 이메일 발송
    const resultUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/result/${params.matchId}`;
    const emailContent = buildNotificationEmail({
      aName: session.userAName,
      bName: row.user_b_name || "친구",
      resultUrl,
    });
    await sendEmail({ ...emailContent, to: session.notifyEmail }).catch(console.error);

    return NextResponse.json({ success: true, resultId: result.id });
  } catch (error) {
    console.error("[match/compare error]", error);
    return NextResponse.json({ error: "비교 실패" }, { status: 500 });
  }
}
