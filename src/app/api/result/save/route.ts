import { NextRequest, NextResponse } from "next/server";
import { saveUserResult, getUserSavedResults } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId, matchResultId } = await req.json();
    if (!userId || !matchResultId) {
      return NextResponse.json({ error: "필수 값 누락" }, { status: 400 });
    }
    const saved = await saveUserResult(userId, matchResultId);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[result/save error]", error);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId 필요" }, { status: 400 });
  const results = await getUserSavedResults(userId);
  return NextResponse.json(results);
}
