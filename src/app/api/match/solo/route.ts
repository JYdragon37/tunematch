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
import type { TasteType } from "@/types";

// 취향 유형별 추천 채널 (실제 유명 YouTube 채널)
const TASTE_RECOMMENDATIONS: Record<TasteType, Array<{ id: string; title: string; customCategory: string }>> = {
  tech:          [{ id: "r1", title: "Fireship", customCategory: "tech" }, { id: "r2", title: "Theo - t3.gg", customCategory: "tech" }, { id: "r3", title: "Traversy Media", customCategory: "tech" }],
  knowledge:     [{ id: "r4", title: "Kurzgesagt", customCategory: "knowledge" }, { id: "r5", title: "Veritasium", customCategory: "knowledge" }, { id: "r6", title: "TED", customCategory: "knowledge" }],
  entertainment: [{ id: "r7", title: "MrBeast", customCategory: "entertainment" }, { id: "r8", title: "Mark Rober", customCategory: "entertainment" }, { id: "r9", title: "Mythbusters", customCategory: "entertainment" }],
  humor:         [{ id: "r10", title: "Ryan George", customCategory: "humor" }, { id: "r11", title: "Gus Johnson", customCategory: "humor" }, { id: "r12", title: "Drew Gooden", customCategory: "humor" }],
  music:         [{ id: "r13", title: "NPR Music", customCategory: "music" }, { id: "r14", title: "Tiny Desk Concerts", customCategory: "music" }, { id: "r15", title: "Colors", customCategory: "music" }],
  lifestyle:     [{ id: "r16", title: "Joshua Weissman", customCategory: "food" }, { id: "r17", title: "Yes Theory", customCategory: "lifestyle" }, { id: "r18", title: "Pick Up Limes", customCategory: "lifestyle" }],
  news:          [{ id: "r22", title: "TLDR News", customCategory: "news" }, { id: "r23", title: "Vox", customCategory: "news" }, { id: "r24", title: "Johnny Harris", customCategory: "news" }],
  collector:     [{ id: "r25", title: "Tom Scott", customCategory: "knowledge" }, { id: "r26", title: "CGP Grey", customCategory: "knowledge" }, { id: "r27", title: "Wendover Productions", customCategory: "knowledge" }],
};
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

    // 항상 재분석 (채널 분류 로직 업데이트 적용)
    // TODO: 카테고리 분류 안정화 후 캐시 복원

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
      recommendations: (TASTE_RECOMMENDATIONS[tasteType] || TASTE_RECOMMENDATIONS.collector).map(c => ({
        ...c,
        thumbnail: "",
        categoryId: c.customCategory,
        customCategory: c.customCategory as any,
      })),
      userAVector: vecA,
      userBVector: vecA,
      tasteType,
      diversityIndex,
      friendType,
      friendTypeReason,
      topCategories,
      channelCount: channelsA.length,
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
