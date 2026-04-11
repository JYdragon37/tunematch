import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const result = mockStore.getResultBySession(params.matchId);
  if (!result) {
    const session = mockStore.getSession(params.matchId);
    if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });
    return NextResponse.json({ status: session.status, result: null });
  }
  return NextResponse.json({ status: "done", result });
}
