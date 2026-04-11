import { NextRequest, NextResponse } from "next/server";
import { getSession, saveResult, updateSession, getResultBySession } from "@/lib/db";
import {
  buildCategoryVector, classifyTasteType, calcDiversityIndex, getTopCategories,
  getFriendType, generateSoloComment, analyzeChannelStats, analyzeLikedVideos,
} from "@/lib/algorithm";
import { fetchYouTubeData } from "@/lib/youtube";
import { mockRecommendedChannels } from "@/data/mock-channels";
import { getCuratedRecommendations } from "@/data/curated-channels";
import { supabaseAdmin } from "@/lib/supabase";
import type { Channel, TasteType } from "@/types";
import { v4 as uuidv4 } from "uuid";

const TASTE_RECOMMENDATIONS: Record<TasteType, Array<{ id: string; title: string; customCategory: string }>> = {
  tech:          [{ id: "r1", title: "Fireship", customCategory: "tech" }, { id: "r2", title: "Theo - t3.gg", customCategory: "tech" }, { id: "r3", title: "Traversy Media", customCategory: "tech" }],
  knowledge:     [{ id: "r4", title: "Kurzgesagt", customCategory: "knowledge" }, { id: "r5", title: "Veritasium", customCategory: "knowledge" }, { id: "r6", title: "TED", customCategory: "knowledge" }],
  entertainment: [{ id: "r7", title: "MrBeast", customCategory: "entertainment" }, { id: "r8", title: "Mark Rober", customCategory: "entertainment" }, { id: "r9", title: "Yes Theory", customCategory: "entertainment" }],
  humor:         [{ id: "r10", title: "Ryan George", customCategory: "humor" }, { id: "r11", title: "Gus Johnson", customCategory: "humor" }, { id: "r12", title: "Drew Gooden", customCategory: "humor" }],
  music:         [{ id: "r13", title: "NPR Music", customCategory: "music" }, { id: "r14", title: "THE FIRST TAKE", customCategory: "music" }, { id: "r15", title: "Colors", customCategory: "music" }],
  lifestyle:     [{ id: "r16", title: "Joshua Weissman", customCategory: "food" }, { id: "r17", title: "Yes Theory", customCategory: "lifestyle" }, { id: "r18", title: "Pick Up Limes", customCategory: "lifestyle" }],
  news:          [{ id: "r22", title: "TLDR News", customCategory: "news" }, { id: "r23", title: "Vox", customCategory: "news" }, { id: "r24", title: "Johnny Harris", customCategory: "news" }],
  collector:     [{ id: "r25", title: "Tom Scott", customCategory: "knowledge" }, { id: "r26", title: "CGP Grey", customCategory: "knowledge" }, { id: "r27", title: "Wendover Productions", customCategory: "knowledge" }],
};

export async function POST(req: NextRequest) {
  try {
    const { matchId, accessToken: reqToken } = await req.json();
    const session = await getSession(matchId);
    if (!session) return NextResponse.json({ error: "세션 없음" }, { status: 404 });

    // Supabase에서 저장된 채널 가져오기
    const { data: sessionRow, error: sessionErr } = await supabaseAdmin
      .from("match_sessions")
      .select("channels_a")
      .eq("id", matchId)
      .single();

    if (sessionErr) {
      console.error("[solo] session channels_a 조회 에러:", sessionErr.message);
      return NextResponse.json({
        error: "SESSION_READ_ERROR",
        message: "채널 데이터를 읽을 수 없습니다. 다시 연동해주세요."
      }, { status: 500 });
    }

    let channelsA: Channel[] = [];
    let usedMock = false;
    if (sessionRow?.channels_a) {
      try { channelsA = JSON.parse(sessionRow.channels_a); } catch {}
    }
    if (channelsA.length === 0) {
      console.log("[solo] channels_a 없음 → mock 폴백");
      const { mockChannelsA } = await import("@/data/mock-channels");
      channelsA = mockChannelsA;
      usedMock = true;
    }

    // accessToken: 요청에서만 받음 (채널 통계/좋아요 API용)
    const accessToken = reqToken || "";

    // 채널 통계 + 좋아요 영상 병렬 수집
    const [channelStatsRaw, likedVideos] = await Promise.all([
      import("@/lib/youtube").then(m => m.fetchChannelStats(accessToken, channelsA)),
      import("@/lib/youtube").then(m => m.fetchLikedVideos(accessToken)),
    ]);

    const vecA = buildCategoryVector(channelsA);
    const tasteType = classifyTasteType(vecA);
    const diversityIndex = calcDiversityIndex(vecA);
    const topCategories = getTopCategories(vecA);
    const { type: friendType, reason: friendTypeReason } = getFriendType(tasteType);
    const { comment, commentType } = generateSoloComment(tasteType, diversityIndex);

    // 심화 분석
    const channelStatsData = analyzeChannelStats(channelStatsRaw, channelsA);
    const likedVideoInsight = analyzeLikedVideos(likedVideos, vecA);

    // 큐레이션 추천 (이미 구독한 채널 제외)
    const subscribedIds = new Set(channelsA.map(c => c.id));
    const curatedRecs = getCuratedRecommendations(tasteType, subscribedIds, "KR", 5);

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
      recommendations: (TASTE_RECOMMENDATIONS[tasteType] || TASTE_RECOMMENDATIONS.collector).map(c => ({
        ...c, thumbnail: "", categoryId: c.customCategory, customCategory: c.customCategory as any,
      })),
      userAVector: vecA,
      userBVector: vecA,
      tasteType,
      diversityIndex,
      friendType,
      friendTypeReason,
      topCategories,
      channelCount: channelsA.length,
      channelStatsData: channelStatsData || undefined,
      likedVideoInsight: likedVideoInsight || undefined,
      curatedRecs,
      createdAt: new Date().toISOString(),
    };

    await saveResult(result as any);
    await updateSession(matchId, { status: "done", resultId: result.id });

    // Telegram으로 분석 결과 전송 (비동기, 실패해도 무관)
    import("@/lib/telegram").then(({ sendMessage, formatSoloResult }) => {
      const msg = formatSoloResult({
        userAName: result.userAName,
        tasteType: result.tasteType,
        commentType: result.commentType,
        comment: result.comment,
        diversityIndex: result.diversityIndex,
        channelCount: result.channelCount,
        topCategories: result.topCategories,
        channelStatsData: result.channelStatsData as any,
        likedVideoInsight: result.likedVideoInsight as any,
      });
      sendMessage(msg).catch(console.error);
    }).catch(console.error);

    return NextResponse.json({ resultId: result.id, usedMock });
  } catch (error) {
    console.error("[match/solo error]", error);
    return NextResponse.json({ error: "분석 실패" }, { status: 500 });
  }
}
