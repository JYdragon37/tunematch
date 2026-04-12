import { NextRequest, NextResponse } from "next/server";
import { getSession, getResultBySession, getResult, getComparisonResult } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getSession(params.matchId);
  if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });

  // 1순위: result_id로 직접 조회 (compare 완료 시 가장 신뢰할 수 있는 신호)
  if (session.resultId) {
    const compResult = await getResult(session.resultId);
    if (compResult && compResult.tasteType === undefined) {
      return NextResponse.json({ status: "done", sessionStatus: "done", result: compResult });
    }
  }

  // 2순위: match_results에서 비교 결과(taste_type=null) 직접 검색
  // session.status가 stale하더라도 비교 결과가 존재하면 done으로 처리
  const compResult = await getComparisonResult(params.matchId);
  if (compResult) {
    return NextResponse.json({ status: "done", sessionStatus: "done", result: compResult });
  }

  // 3순위: 솔로 결과 + session.status로 대기 상태 판단
  const result = await getResultBySession(params.matchId);

  if (!result) {
    return NextResponse.json({ status: session.status, sessionStatus: session.status, result: null });
  }

  if (session.status === "done") {
    return NextResponse.json({ status: "analyzing", sessionStatus: "done", result: null });
  }

  return NextResponse.json({ status: "solo_done", sessionStatus: session.status, result });
}
