import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";
import { fetchSubscribedChannels } from "@/lib/youtube";
import { analyzeCompatibility } from "@/lib/algorithm";
import { sendEmail, buildNotificationEmail } from "@/lib/email";
import { mockRecommendedChannels } from "@/data/mock-channels";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId, userName, accessToken } = await req.json();
    const session = mockStore.getSession(params.matchId);

    if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });
    if (session.status === "expired") return NextResponse.json({ error: "만료된 링크" }, { status: 410 });
    if (session.status === "done") return NextResponse.json({ error: "이미 완료된 매칭" }, { status: 409 });

    // B 유저 채널 수집
    const channelsB = await fetchSubscribedChannels(accessToken, "B");
    const channelsA = (mockStore as any)._channelsA?.[params.matchId] || [];

    // 분석 실행
    mockStore.updateSession(params.matchId, { status: "analyzing", userBId: userId || uuidv4(), userBName: userName });

    const result = analyzeCompatibility(
      params.matchId,
      session.userAName,
      userName || "사용자B",
      channelsA,
      channelsB,
      mockRecommendedChannels
    );

    mockStore.saveResult(result);
    mockStore.updateSession(params.matchId, { status: "done", resultId: result.id });

    // A에게 이메일 알림
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
