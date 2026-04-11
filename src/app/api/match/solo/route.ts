import { NextRequest, NextResponse } from "next/server";
import { getSession, saveResult, updateSession, getResultBySession } from "@/lib/db";
import {
  buildCategoryVector,
  classifyTasteType,
  calcDiversityIndex,
  getTopCategories,
  getFriendType,
  generateSoloComment,
} from "@/lib/algorithm";
import { mockRecommendedChannels } from "@/data/mock-channels";
import { supabaseAdmin } from "@/lib/supabase";
import type { Channel } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { matchId } = await req.json();
    const session = await getSession(matchId);
    if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });

    const { data: sessionRow } = await supabaseAdmin
      .from("match_sessions")
      .select("channels_a")
      .eq("id", matchId)
      .single();

    let channelsA: Channel[] = [];
    let usedMock = false;
    if (sessionRow?.channels_a) {
      try { channelsA = JSON.parse(sessionRow.channels_a); } catch {}
    }
    if (channelsA.length === 0) {
      const { mockChannelsA } = await import("@/data/mock-channels");
      channelsA = mockChannelsA;
      usedMock = true;
    }

    // 실제 채널이 있으면 기존 결과 재사용 (캐시)
    // mock 채널이면 항상 재분석 (YouTube 재연동 후 정확한 결과 제공)
    const existing = await getResultBySession(matchId);
    if (existing && !usedMock) return NextResponse.json({ resultId: existing.id });

    const vecA = buildCategoryVector(channelsA);
    const tasteType = classifyTasteType(vecA);
    const diversityIndex = calcDiversityIndex(vecA);
    const topCategories = getTopCategories(vecA);
    const { type: friendType, reason: friendTypeReason } = getFriendType(tasteType);
    const { comment, commentType } = generateSoloComment(tasteType, diversityIndex);

    const channelScore = Math.min(30, Math.round(channelsA.length / 2));
    const categoryScore = diversityIndex;

    const result = {
      id: uuidv4(),
      matchSessionId: matchId,
      userAName: session.userAName,
      userBName: "나의 취향 분석",
      totalScore: Math.min(100, channelScore + Math.round(diversityIndex * 0.7)),
      channelScore,
      categoryScore,
      curiosityScore: Math.round((vecA.knowledge + vecA.tech) * 100),
      humorScore: Math.round(vecA.humor * 100),
      patternScore: Math.round((vecA.lifestyle + vecA.music) * 100),
      comment,
      commentType,
      commonChannels: channelsA.slice(0, 5),
      recommendations: mockRecommendedChannels,
      userAVector: vecA,
      userBVector: vecA,
      tasteType,
      diversityIndex,
      friendType,
      friendTypeReason,
      topCategories,
      createdAt: new Date().toISOString(),
    };

    await saveResult(result as any);
    await updateSession(matchId, { status: "done", resultId: result.id });

    return NextResponse.json({ resultId: result.id });
  } catch (error) {
    console.error("[match/solo error]", error);
    return NextResponse.json({ error: "분석 실패" }, { status: 500 });
  }
}
