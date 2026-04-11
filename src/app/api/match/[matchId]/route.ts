import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = mockStore.getSession(params.matchId);
  if (!session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
  }

  // 만료 체크
  if (new Date(session.expiresAt) < new Date()) {
    mockStore.updateSession(params.matchId, { status: "expired" });
    return NextResponse.json({ error: "만료된 링크입니다" }, { status: 410 });
  }

  return NextResponse.json(session);
}
