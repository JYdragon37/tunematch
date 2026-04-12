import { NextRequest, NextResponse } from "next/server";
import { getSession, getResultBySession, getResult } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getSession(params.matchId);
  if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });

  // result_id가 있으면 → compare 완료. result_id로 비교 결과 직접 조회 (session.status보다 신뢰도 높음)
  if (session.resultId) {
    const compResult = await getResult(session.resultId);
    if (compResult && compResult.tasteType === undefined) {
      return NextResponse.json({ status: "done", sessionStatus: "done", result: compResult });
    }
  }

  const result = await getResultBySession(params.matchId);

  if (!result) {
    return NextResponse.json({ status: session.status, sessionStatus: session.status, result: null });
  }

  // session.status가 done인 경우 (result_id 없는 엣지 케이스)
  if (session.status === "done") {
    if (result.tasteType !== undefined) {
      return NextResponse.json({ status: "analyzing", sessionStatus: "done", result: null });
    }
    return NextResponse.json({ status: "done", sessionStatus: "done", result });
  }

  // 솔로 결과는 있지만 친구가 아직 비교 안 함
  return NextResponse.json({ status: "solo_done", sessionStatus: session.status, result });
}
