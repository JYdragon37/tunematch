import { NextRequest, NextResponse } from "next/server";
import { getSession, saveResult, updateSession } from "@/lib/db";
import { getResultBySession } from "@/lib/db";
import { buildCategoryVector, calcSubscores, generateComment } from "@/lib/algorithm";
import { mockRecommendedChannels } from "@/data/mock-channels";
import { supabaseAdmin } from "@/lib/supabase";
import type { Channel, MatchResult, CategoryVector } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { matchId } = await req.json();
    const session = await getSession(matchId);
    if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });

    // 이미 결과 있으면 반환
    const existing = await getResultBySession(matchId);
    if (existing) return NextResponse.json({ resultId: existing.id });

    // A의 채널 데이터 가져오기
    const { data: sessionRow } = await supabaseAdmin
      .from("match_sessions")
      .select("channels_a")
      .eq("id", matchId)
      .single();

    let channelsA: Channel[] = [];
    if (sessionRow?.channels_a) {
      try { channelsA = JSON.parse(sessionRow.channels_a); } catch {}
    }

    if (channelsA.length === 0) {
      return NextResponse.json({ error: "채널 데이터 없음" }, { status: 400 });
    }

    const vecA = buildCategoryVector(channelsA);

    // 솔로 분석: 카테고리 분포 기반 점수 산출
    const dominantCategories = (Object.entries(vecA) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const diversityScore = Math.round(
      Object.values(vecA).filter((v) => v > 0.05).length * 10 + 20
    );

    const { curiosityScore, humorScore, patternScore } = calcSubscores(vecA, vecA);

    const tasteTypes: Record<string, string> = {
      tech: "테크 인플루언서형",
      knowledge: "지식 탐험가형",
      entertainment: "엔터 마니아형",
      humor: "유머 감각파형",
      music: "음악 감성형",
      lifestyle: "라이프스타일러형",
      food: "미식 탐험가형",
      news: "시사 분석가형",
    };

    const topCategory = dominantCategories[0]?.[0] || "entertainment";
    const tasteType = tasteTypes[topCategory] || "콘텐츠 탐험가형";

    const soloComments: Record<string, string> = {
      tech: "기술과 정보에 진심인 사람. 알고리즘이 당신의 뇌를 이미 파악했어요.",
      knowledge: "세상 모든 것에 호기심이 넘치는 타입. 유튜브가 당신의 두 번째 교과서예요.",
      entertainment: "콘텐츠 자체를 즐기는 진짜 엔터테인먼트 러버. 알고리즘이 친구 같은 사람.",
      humor: "웃음에 진심인 사람. 당신의 피드는 항상 유쾌할 거예요.",
      music: "감성과 리듬으로 세상을 느끼는 타입. 당신의 취향은 선명한 색깔이 있어요.",
      lifestyle: "삶의 질에 진심인 사람. 영감을 일상으로 만드는 능력자 타입.",
      food: "먹는 것에 진지한 사람. 당신의 식탁은 항상 흥미로울 것 같아요.",
      news: "세상 돌아가는 것에 관심이 많은 타입. 정보를 권력으로 만드는 사람.",
    };

    const result: MatchResult = {
      id: uuidv4(),
      matchSessionId: matchId,
      userAName: session.userAName,
      userBName: "나의 취향 분석",
      totalScore: Math.min(100, diversityScore + Math.round(curiosityScore * 0.3)),
      channelScore: Math.min(30, Math.round(channelsA.length / 2)),
      categoryScore: diversityScore,
      curiosityScore,
      humorScore,
      patternScore,
      comment: soloComments[topCategory] || "유튜브 취향이 뚜렷한 사람이에요.",
      commentType: tasteType,
      commonChannels: channelsA.slice(0, 5),
      recommendations: mockRecommendedChannels,
      userAVector: vecA,
      userBVector: vecA,
      createdAt: new Date().toISOString(),
    };

    await saveResult(result);
    await updateSession(matchId, { status: "done", resultId: result.id });

    return NextResponse.json({ resultId: result.id });
  } catch (error) {
    console.error("[match/solo error]", error);
    return NextResponse.json({ error: "분석 실패" }, { status: 500 });
  }
}
