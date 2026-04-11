import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("match_sessions")
      .select("b_solo_result, user_b_name, user_a_name, status")
      .eq("id", params.matchId)
      .single();

    if (error || !data) return NextResponse.json({ error: "세션 없음" }, { status: 404 });
    if (!data.b_solo_result) return NextResponse.json({ error: "B 솔로 결과 없음" }, { status: 404 });

    return NextResponse.json({
      result: data.b_solo_result,
      userBName: data.user_b_name,
      userAName: data.user_a_name,
      status: data.status,
    });
  } catch (error) {
    console.error("[b-solo error]", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
