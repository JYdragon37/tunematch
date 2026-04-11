import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSessionChannelsB } from "@/lib/db";
import { fetchSubscribedChannels } from "@/lib/youtube";
import {
  buildCategoryVector, classifyTasteType, calcDiversityIndex, getTopCategories,
  getFriendType, generateSoloComment,
} from "@/lib/algorithm";
import { getCuratedRecommendations, getTrendingRecommendations } from "@/data/curated-channels";
import { v4 as uuidv4 } from "uuid";
import type { Channel } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId, userName, accessToken } = await req.json();
    const session = await getSession(params.matchId);

    if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });
    if (session.status === "expired") return NextResponse.json({ error: "만료된 링크" }, { status: 410 });
    if (session.status === "done") return NextResponse.json({ error: "이미 완료된 매칭" }, { status: 409 });

    // ① B의 구독 채널 수집 (채널통계/좋아요는 타임아웃 방지로 제외)
    const channelsB: Channel[] = await fetchSubscribedChannels(accessToken || "", "B");

    // ② 기본 솔로 분석 (빠른 연산만)
    const vecB = buildCategoryVector(channelsB);
    const tasteType = classifyTasteType(vecB);
    const diversityIndex = calcDiversityIndex(vecB);
    const topCategories = getTopCategories(vecB);
    const { type: friendType, reason: friendTypeReason } = getFriendType(tasteType);
    const { comment, commentType } = generateSoloComment(tasteType, diversityIndex);

    const subscribedIds = new Set(channelsB.map((c) => c.id));
    const curatedRecs = getCuratedRecommendations(tasteType, subscribedIds, "KR", 5);
    const trendingRecs = getTrendingRecommendations(tasteType, subscribedIds, "KR", 5);

    const channelScore = Math.min(30, Math.round(channelsB.length / 2));
    const bSoloResult = {
      id: uuidv4(),
      matchSessionId: params.matchId,
      userAName: userName || "사용자B",
      userBName: "나의 취향 분석",
      totalScore: Math.min(100, channelScore + Math.round(diversityIndex * 0.7)),
      channelScore,
      categoryScore: diversityIndex,
      curiosityScore: Math.round((vecB.knowledge + vecB.tech) * 100),
      humorScore: Math.round(vecB.humor * 100),
      patternScore: Math.round((vecB.lifestyle + vecB.music) * 100),
      comment,
      commentType,
      commonChannels: channelsB.slice(0, 5),
      recommendations: [],
      userAVector: vecB,
      userBVector: vecB,
      tasteType,
      diversityIndex,
      friendType,
      friendTypeReason,
      topCategories,
      channelCount: channelsB.length,
      curatedRecs,
      trendingRecs,
      createdAt: new Date().toISOString(),
    };

    // ③ DB에 channels_b + b_solo_result 저장, status → b_joined
    await updateSessionChannelsB(params.matchId, {
      userBId: userId || uuidv4(),
      userBName: userName || "사용자B",
      channelsBJson: JSON.stringify(channelsB),
      bSoloResult,
    });

    return NextResponse.json({ soloResult: bSoloResult, userAName: session.userAName });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[match/join error]", msg);
    return NextResponse.json({ error: "분석 실패", detail: msg }, { status: 500 });
  }
}
