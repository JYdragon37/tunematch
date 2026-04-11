import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/db";
import { fetchSubscribedChannels } from "@/lib/youtube";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { userId, userName, email, accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "YOUTUBE_TOKEN_MISSING", message: "YouTube 연동이 필요합니다. 다시 로그인해주세요." }, { status: 401 });
    }

    let channels;
    try {
      channels = await fetchSubscribedChannels(accessToken, "A");
    } catch (err: any) {
      const code = err.message || "YOUTUBE_API_ERROR";
      const message =
        code === "YOUTUBE_TOKEN_EXPIRED" ? "YouTube 토큰이 만료됐습니다. 다시 로그인해주세요." :
        code === "YOUTUBE_SCOPE_MISSING" ? "YouTube 구독 채널 접근 권한이 없습니다. 다시 로그인해주세요." :
        code === "YOUTUBE_QUOTA_EXCEEDED" ? "YouTube API 한도를 초과했습니다. 잠시 후 다시 시도해주세요." :
        "YouTube 채널을 가져올 수 없습니다. 다시 로그인해주세요.";
      console.error("[match/create] YouTube 에러:", code);
      return NextResponse.json({ error: code, message }, { status: 503 });
    }

    const session = await createSession({
      userAId: userId || uuidv4(),
      userAName: userName || "사용자A",
      notifyEmail: email,
      channelsAJson: JSON.stringify(channels),
    });

    const matchUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/m/${session.id}`;
    return NextResponse.json({ matchId: session.id, matchUrl });
  } catch (error) {
    console.error("[match/create error]", error);
    return NextResponse.json({ error: "매칭 세션 생성 실패" }, { status: 500 });
  }
}
