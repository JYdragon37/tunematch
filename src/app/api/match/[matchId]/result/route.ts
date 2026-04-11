import { NextRequest, NextResponse } from "next/server";
import { getSession, getResultBySession } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const result = await getResultBySession(params.matchId);
  if (!result) {
    const session = await getSession(params.matchId);
    if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });
    return NextResponse.json({ status: session.status, result: null });
  }
  return NextResponse.json({ status: "done", result });
}
