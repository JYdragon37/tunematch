import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  buildCategoryVector, classifyTasteType, calcDiversityIndex, getTopCategories,
  getFriendType, generateSoloComment, analyzeChannelStats, analyzeLikedVideos,
} from "@/lib/algorithm";
import { fetchChannelStats, fetchLikedVideos } from "@/lib/youtube";
import { getCuratedRecommendations, getTrendingRecommendations } from "@/data/curated-channels";
import { v4 as uuidv4 } from "uuid";
import type { Channel } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { accessToken, userName } = await req.json();

    // channels_b + 기본 solo 정보 조회
    const { data: row, error } = await supabaseAdmin
      .from("match_sessions")
      .select("channels_b, user_b_name, user_a_name")
      .eq("id", params.matchId)
      .single();

    if (error || !row?.channels_b) {
      return NextResponse.json({ error: "채널 데이터 없음" }, { status: 404 });
    }

    let channelsB: Channel[] = [];
    try { channelsB = JSON.parse(row.channels_b); } catch {}
    if (channelsB.length === 0) {
      return NextResponse.json({ error: "채널 데이터 없음" }, { status: 404 });
    }

    const token = accessToken || "";

    // 채널 통계 + 좋아요 병렬 수집 (A의 solo route와 동일)
    const [channelStatsRaw, likedVideos] = await Promise.all([
      fetchChannelStats(token, channelsB),
      fetchLikedVideos(token),
    ]);

    const vecB = buildCategoryVector(channelsB);
    const tasteType = classifyTasteType(vecB);
    const diversityIndex = calcDiversityIndex(vecB);
    const topCategories = getTopCategories(vecB);
    const { type: friendType, reason: friendTypeReason } = getFriendType(tasteType);
    const { comment, commentType } = generateSoloComment(tasteType, diversityIndex);

    const channelStatsData = analyzeChannelStats(channelStatsRaw, channelsB, likedVideos);
    const subscribedChannelIds = new Set(channelsB.map((c: any) => c.id));
    const likedVideoInsight = analyzeLikedVideos(likedVideos, vecB, subscribedChannelIds);

    const dominantCountry = (channelStatsData as any)?.dominantCountry || "KR";
    const subscribedIds = new Set(channelsB.map(c => c.id));
    const curatedRecs = getCuratedRecommendations(tasteType, subscribedIds, dominantCountry, 5);
    const trendingRecs = getTrendingRecommendations(tasteType, subscribedIds, dominantCountry, 5);

    const channelScore = Math.min(30, Math.round(channelsB.length / 2));
    const fullSoloResult = {
      id: uuidv4(),
      matchSessionId: params.matchId,
      userAName: userName || row.user_b_name || "사용자B",
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
      channelStatsData: channelStatsData || undefined,
      likedVideoInsight: likedVideoInsight || undefined,
      curatedRecs,
      trendingRecs,
      createdAt: new Date().toISOString(),
    };

    // b_solo_result 업데이트
    const { error: updateErr } = await supabaseAdmin
      .from("match_sessions")
      .update({ b_solo_result: fullSoloResult })
      .eq("id", params.matchId);

    if (updateErr) throw new Error(`b_solo_result 업데이트 실패: ${updateErr.message}`);

    return NextResponse.json({ soloResult: fullSoloResult, userAName: row.user_a_name });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[b-analyze error]", msg);
    return NextResponse.json({ error: "분석 실패", detail: msg }, { status: 500 });
  }
}
