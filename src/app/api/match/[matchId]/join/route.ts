import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession, saveResult } from "@/lib/db";
import { fetchSubscribedChannels } from "@/lib/youtube";
import { analyzeCompatibility } from "@/lib/algorithm";
import { sendEmail, buildNotificationEmail } from "@/lib/email";
import { mockRecommendedChannels } from "@/data/mock-channels";
import { v4 as uuidv4 } from "uuid";
import type { Channel } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId, userName, accessToken } = await req.json();
    const session = await getSession(params.matchId);

    if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });
    if (session.status === "expired") return NextResponse.json({ error: "만료된 링크" }, { status: 410 });
    if (session.status === "done") return NextResponse.json({ error: "이미 완료된 매칭" }, { status: 409 });

    const channelsB = await fetchSubscribedChannels(accessToken, "B");

    // Supabase에서 A의 채널 데이터 가져오기
    const { supabaseAdmin } = await import("@/lib/supabase");
    const { data: sessionRow, error: sessionRowError } = await supabaseAdmin
      .from("match_sessions")
      .select("channels_a")
      .eq("id", params.matchId)
      .single();

    if (sessionRowError) {
      console.error("[match/join] channels_a 조회 실패:", sessionRowError.message);
    }

    let channelsA: Channel[] = [];
    if (sessionRow?.channels_a) {
      try {
        channelsA = JSON.parse(sessionRow.channels_a);
      } catch (parseErr) {
        console.error("[match/join] channels_a JSON 파싱 실패:", parseErr);
      }
    }

    if (channelsA.length === 0) {
      return NextResponse.json({
        error: "CHANNELS_UNAVAILABLE",
        message: "A 유저의 채널 데이터를 찾을 수 없습니다. A 유저가 다시 연동해야 합니다."
      }, { status: 422 });
    }

    await updateSession(params.matchId, {
      status: "analyzing",
      userBId: userId || uuidv4(),
      userBName: userName,
    });

    const result = analyzeCompatibility(
      params.matchId,
      session.userAName,
      userName || "사용자B",
      channelsA,
      channelsB,
      mockRecommendedChannels
    );

    await saveResult(result);
    await updateSession(params.matchId, { status: "done", resultId: result.id });

    const resultUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/result/${params.matchId}`;
    const emailContent = buildNotificationEmail({
      aName: session.userAName,
      bName: userName || "사용자B",
      resultUrl,
    });
    await sendEmail({ ...emailContent, to: session.notifyEmail });

    return NextResponse.json({ success: true, resultId: result.id });
  } catch (error) {
    console.error("[match/join error]", error);
    return NextResponse.json({ error: "분석 실패" }, { status: 500 });
  }
}
