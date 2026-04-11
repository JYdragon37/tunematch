import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";
import { fetchSubscribedChannels } from "@/lib/youtube";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { userId, userName, email, accessToken } = await req.json();

    // YouTube 구독 채널 수집 (A)
    const channels = await fetchSubscribedChannels(accessToken, "A");

    // 세션 생성
    const session = mockStore.createSession({
      userAId: userId || uuidv4(),
      userAName: userName || "사용자A",
      status: "waiting",
      notifyEmail: email,
      // 채널 데이터를 세션에 임시 저장 (실제로는 별도 테이블)
    });

    // 채널 데이터를 세션 메타에 저장 (mock용)
    (mockStore as any)._channelsA = (mockStore as any)._channelsA || {};
    (mockStore as any)._channelsA[session.id] = channels;

    const matchUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/m/${session.id}`;

    return NextResponse.json({ matchId: session.id, matchUrl });
  } catch (error) {
    console.error("[match/create error]", error);
    return NextResponse.json({ error: "매칭 세션 생성 실패" }, { status: 500 });
  }
}
