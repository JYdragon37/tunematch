import { NextRequest, NextResponse } from "next/server";
import { getSession, getResultBySession } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getSession(params.matchId);
  if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });

  const result = await getResultBySession(params.matchId);

  if (!result) {
    return NextResponse.json({ status: session.status, sessionStatus: session.status, result: null });
  }

  // 비교 완료 상태
  if (session.status === "done") {
    return NextResponse.json({ status: "done", sessionStatus: "done", result });
  }

  // 솔로 결과는 있지만 친구가 아직 비교 안 함
  return NextResponse.json({ status: "solo_done", sessionStatus: session.status, result });
}
