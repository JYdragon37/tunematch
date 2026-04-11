import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/db";
import { fetchSubscribedChannels } from "@/lib/youtube";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { userId, userName, email, accessToken } = await req.json();

    const channels = await fetchSubscribedChannels(accessToken, "A");

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
