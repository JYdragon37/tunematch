import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getSession(params.matchId);
  if (!session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
  }

  if (new Date(session.expiresAt) < new Date() && session.status === "waiting") {
    await updateSession(params.matchId, { status: "expired" });
    return NextResponse.json({ error: "만료된 링크입니다" }, { status: 410 });
  }

  return NextResponse.json(session);
}
