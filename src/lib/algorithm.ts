import type { Channel, CategoryKey, CategoryVector, MatchResult, ScoreDetail, TasteType, TopCategory, ChannelStatItem, ChannelStatsData, LikedVideoInsight } from "@/types";
import type { ChannelStat, LikedVideo } from "./youtube";
import { v4 as uuidv4 } from "uuid";

const CATEGORY_WEIGHTS: Record<CategoryKey, number> = {
  entertainment: 1,
  knowledge: 1,
  humor: 1,
  lifestyle: 1,
  music: 1,
  news: 1,
  food: 1,
  tech: 1,
};

/**
 * 채널 겹침률 (Jaccard 유사도) - 30점
 */
export function calcChannelScore(
  channelsA: Channel[],
  channelsB: Channel[]
): { score: number; commonChannels: Channel[] } {
  const setA = new Set(channelsA.map((c) => c.id));
  const setB = new Set(channelsB.map((c) => c.id));

  const intersection = channelsA.filter((c) => setB.has(c.id));
  const unionSize = new Set([...channelsA.map((c) => c.id), ...channelsB.map((c) => c.id)]).size;

  const jaccard = unionSize === 0 ? 0 : intersection.length / unionSize;
  const score = Math.round(jaccard * 30);

  return { score, commonChannels: intersection };
}

/**
 * 카테고리 비중 벡터 생성
 */
export function buildCategoryVector(channels: Channel[]): CategoryVector {
  const counts: CategoryVector = {
    entertainment: 0,
    knowledge: 0,
    humor: 0,
    lifestyle: 0,
    music: 0,
    news: 0,
    food: 0,
    tech: 0,
  };

  channels.forEach((c) => {
    if (c.customCategory in counts) {
      counts[c.customCategory]++;
    }
  });

  const total = channels.length || 1;
  return {
    entertainment: counts.entertainment / total,
    knowledge: counts.knowledge / total,
    humor: counts.humor / total,
    lifestyle: counts.lifestyle / total,
    music: counts.music / total,
    news: counts.news / total,
    food: counts.food / total,
    tech: counts.tech / total,
  };
}

/**
 * 코사인 유사도 계산
 */
export function cosineSimilarity(vecA: CategoryVector, vecB: CategoryVector): number {
  const keys = Object.keys(vecA) as CategoryKey[];
  const dot = keys.reduce((sum, k) => sum + vecA[k] * vecB[k], 0);
  const magA = Math.sqrt(keys.reduce((sum, k) => sum + vecA[k] ** 2, 0));
  const magB = Math.sqrt(keys.reduce((sum, k) => sum + vecB[k] ** 2, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * 카테고리 유사도 (50점)
 */
export function calcCategoryScore(vecA: CategoryVector, vecB: CategoryVector): number {
  const similarity = cosineSimilarity(vecA, vecB);
  return Math.round(similarity * 50);
}

/**
 * 지적 호기심 점수 (knowledge + tech 카테고리 기반) - curiosityScore
 * 시청 패턴 유사도 (20점 중 패턴/유머 점수로 분배)
 */
export function calcSubscores(
  vecA: CategoryVector,
  vecB: CategoryVector
): { curiosityScore: number; humorScore: number; patternScore: number } {
  const knowledgeAvg = ((vecA.knowledge + vecA.tech) + (vecB.knowledge + vecB.tech)) / 2;
  const curiosityScore = Math.round(knowledgeAvg * 100 * 0.85 + 40);

  const humorSim = 1 - Math.abs(vecA.humor - vecB.humor);
  const humorScore = Math.round(humorSim * 60 + 20);

  const lifestyleSim = 1 - Math.abs(vecA.lifestyle - vecB.lifestyle);
  const musicSim = 1 - Math.abs(vecA.music - vecB.music);
  const patternScore = Math.round((lifestyleSim * 0.6 + musicSim * 0.4) * 80 + 10);

  return {
    curiosityScore: Math.min(100, Math.max(0, curiosityScore)),
    humorScore: Math.min(100, Math.max(0, humorScore)),
    patternScore: Math.min(100, Math.max(0, patternScore)),
  };
}

/**
 * 취향 유형 코멘트 생성
 */
interface CommentResult {
  comment: string;
  type: string;
}

export function generateComment(
  totalScore: number,
  vecA: CategoryVector,
  vecB: CategoryVector
): CommentResult {
  if (totalScore >= 85) {
    return {
      comment: "거의 같은 유튜브로 살고 있는 사이. 알고리즘이 당신들을 위해 설계됐어요.",
      type: "취향 쌍둥이",
    };
  }
  if (totalScore >= 70) {
    const humorDiff = Math.abs(vecA.humor - vecB.humor);
    if (humorDiff > 0.15) {
      return {
        comment: "콘텐츠 결은 비슷한데 웃음 코드가 갈리는 사이. 같이 보면 리액션이 달라요.",
        type: "콘텐츠 동지",
      };
    }
    return {
      comment: "좋아하는 장르는 비슷하고, 서로 몰랐던 채널을 추천해줄 수 있는 사이.",
      type: "취향 이웃",
    };
  }
  if (totalScore >= 55) {
    return {
      comment: "겹치는 채널은 적지만, 취향의 결이 은근히 비슷해요. 의외의 공통점을 발견할 수 있어요.",
      type: "숨은 공통점",
    };
  }
  if (totalScore >= 40) {
    return {
      comment: "서로 다른 콘텐츠 세계에서 살고 있어요. 오히려 볼 게 두 배가 되는 사이.",
      type: "콘텐츠 탐험가",
    };
  }
  return {
    comment: "완전히 다른 유튜브 우주에 살고 있네요. 서로의 알고리즘이 충격적일 수도 있어요.",
    type: "평행우주 주민",
  };
}

/**
 * 추천 채널 계산 (서로의 채널 중 상대방이 모르는 채널 상위 3~5개)
 */
export function calcRecommendations(
  channelsA: Channel[],
  channelsB: Channel[],
  fallbackChannels: Channel[]
): Channel[] {
  const setA = new Set(channelsA.map((c) => c.id));
  const setB = new Set(channelsB.map((c) => c.id));

  const fromA = channelsA.filter((c) => !setB.has(c.id)).slice(0, 2);
  const fromB = channelsB.filter((c) => !setA.has(c.id)).slice(0, 2);

  const combined = [...fromA, ...fromB];
  if (combined.length >= 3) return combined.slice(0, 5);
  return [...combined, ...fallbackChannels].slice(0, 5);
}

/**
 * 전체 궁합 분석 실행
 */
export function analyzeCompatibility(
  matchSessionId: string,
  userAName: string,
  userBName: string,
  channelsA: Channel[],
  channelsB: Channel[],
  recommendationPool: Channel[]
): MatchResult {
  const vecA = buildCategoryVector(channelsA);
  const vecB = buildCategoryVector(channelsB);

  const { score: channelScore, commonChannels } = calcChannelScore(channelsA, channelsB);
  const categoryScore = calcCategoryScore(vecA, vecB);
  const { curiosityScore, humorScore, patternScore } = calcSubscores(vecA, vecB);

  const totalScore = channelScore + categoryScore;
  const { comment, type: commentType } = generateComment(totalScore, vecA, vecB);

  const recommendations = calcRecommendations(channelsA, channelsB, recommendationPool);

  return {
    id: uuidv4(),
    matchSessionId,
    userAName,
    userBName,
    totalScore: Math.min(100, totalScore),
    channelScore,
    categoryScore,
    curiosityScore,
    humorScore,
    patternScore,
    comment,
    commentType,
    commonChannels: commonChannels.slice(0, 10),
    recommendations,
    userAVector: vecA,
    userBVector: vecB,
    createdAt: new Date().toISOString(),
  };
}

export function getScoreDetails(result: MatchResult): ScoreDetail[] {
  return [
    { label: "채널 겹침", score: result.channelScore, maxScore: 30, key: "channel" },
    { label: "카테고리 취향", score: result.categoryScore, maxScore: 50, key: "category" },
    { label: "지적 호기심", score: result.curiosityScore, maxScore: 100, key: "curiosity" },
    { label: "유머 코드", score: result.humorScore, maxScore: 100, key: "humor" },
    { label: "시청 패턴", score: result.patternScore, maxScore: 100, key: "pattern" },
  ];
}

// ─── Solo Taste Analysis ───

const CATEGORY_LABELS: Record<string, string> = {
  entertainment: "엔터/게임", knowledge: "지식/교육", humor: "유머/밈",
  lifestyle: "라이프스타일", music: "음악", news: "뉴스/시사", food: "음식/요리", tech: "테크",
};
const CATEGORY_EMOJI: Record<string, string> = {
  entertainment: "🎮", knowledge: "📚", humor: "😂", lifestyle: "🍳",
  music: "🎵", news: "📰", food: "🍜", tech: "💻",
};

export function classifyTasteType(vec: CategoryVector): TasteType {
  if (vec.tech > 0.30) return "tech";
  if (vec.knowledge + vec.tech > 0.40) return "knowledge";
  if (vec.entertainment > 0.30) return "entertainment";
  if (vec.humor > 0.25) return "humor";
  if (vec.music > 0.30) return "music";
  if ((vec.food || 0) + vec.lifestyle > 0.35) return "lifestyle";
  if (vec.news > 0.25) return "news";
  return "collector";
}

export function calcDiversityIndex(vec: CategoryVector): number {
  const values = Object.values(vec) as number[];
  const hhi = values.reduce((sum, v) => sum + v * v, 0);
  return Math.round((1 - hhi) / (1 - 0.125) * 100);
}

export function getTopCategories(vec: CategoryVector): TopCategory[] {
  return (Object.entries(vec) as [CategoryKey, number][])
    .map(([key, val]) => ({
      key,
      percentage: Math.round(val * 100),
      label: CATEGORY_LABELS[key] || key,
      emoji: CATEGORY_EMOJI[key] || "📺",
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .filter((c) => c.percentage > 0)
    .slice(0, 5);
}

const FRIEND_TYPE_MAP: Record<TasteType, { type: TasteType; reason: string }> = {
  knowledge:     { type: "entertainment", reason: "지식에 유머를 더해주는 사이. 대화가 끊이질 않아요." },
  entertainment: { type: "knowledge",     reason: "엔터에 깊이를 더해주는 사이. 유튜브 추천이 매번 새로워요." },
  humor:         { type: "lifestyle",     reason: "같이 있으면 웃고 먹고 행복해지는 조합이에요." },
  music:         { type: "collector",     reason: "음악 외에도 다양한 취향을 공유할 수 있는 사이예요." },
  lifestyle:     { type: "humor",         reason: "맛있는 것 먹으며 웃을 수 있는 찐 친구 조합이에요." },
  news:          { type: "knowledge",     reason: "세상 이야기를 같이 분석하는 토론 파트너예요." },
  tech:          { type: "knowledge",     reason: "기술과 지식의 교집합. 대화 레벨이 딱 맞아요." },
  collector:     { type: "music",         reason: "다양한 취향에 감성을 더해주는 조합이에요." },
};

export function getFriendType(tasteType: TasteType): { type: TasteType; reason: string } {
  return FRIEND_TYPE_MAP[tasteType];
}

// ─── Solo Analysis v2 ───

export function analyzeChannelStats(
  stats: ChannelStat[],
  subscriptions: Channel[]
): ChannelStatsData | null {
  if (stats.length === 0) return null;

  const withSubs = subscriptions.slice(0, stats.length).map((sub, i) => ({
    ...stats[i],
    subscribedAt: (sub as any).subscribedAt || undefined,
  }));

  const sorted = [...withSubs].sort((a, b) => b.subscriberCount - a.subscriberCount);
  const topSub = sorted[0];
  const smallestSub = sorted[sorted.length - 1];

  // 구독 날짜 정렬
  const withDates = withSubs.filter(s => s.subscribedAt);
  withDates.sort((a, b) => new Date(a.subscribedAt!).getTime() - new Date(b.subscribedAt!).getTime());
  const oldest = withDates[0];
  const newest = withDates[withDates.length - 1];

  // 소채널 (10만 이하)
  const hiddenFans = withSubs.filter(s => s.subscriberCount < 100_000);

  // 국가 분포
  const countryCounts: Record<string, number> = {};
  withSubs.forEach(s => {
    const code = s.country || "KR";
    countryCounts[code] = (countryCounts[code] || 0) + 1;
  });
  const countryLabels: Record<string, string> = {
    KR: "🇰🇷 한국", US: "🇺🇸 미국", JP: "🇯🇵 일본",
    GB: "🇬🇧 영국", IN: "🇮🇳 인도", AU: "🇦🇺 호주", CA: "🇨🇦 캐나다",
  };
  const total = withSubs.length;
  const countryDist = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([code, count]) => ({
      code, label: countryLabels[code] || code,
      percent: Math.round((count / total) * 100),
    }));

  function toItem(s: ChannelStat & { subscribedAt?: string }): ChannelStatItem {
    const yearsAgo = s.subscribedAt
      ? Math.floor((Date.now() - new Date(s.subscribedAt).getTime()) / (365.25 * 24 * 3600 * 1000))
      : undefined;
    return {
      title: s.title,
      subscriberCount: s.subscriberCount,
      formattedCount: formatCount(s.subscriberCount),
      subscribedAt: s.subscribedAt,
      yearsAgo,
      country: s.country,
    };
  }

  function formatCount(n: number): string {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
    if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
    return `${n}`;
  }

  return {
    topSubscriber: toItem(topSub),
    smallestSubscriber: toItem(smallestSub),
    oldestSub: oldest ? toItem(oldest) : toItem(sorted[0]),
    newestSub: newest ? toItem(newest) : toItem(sorted[0]),
    hiddenFanCount: hiddenFans.length,
    hiddenFanPercent: Math.round((hiddenFans.length / withSubs.length) * 100),
    countryDist,
  };
}

export function analyzeLikedVideos(
  likedVideos: LikedVideo[],
  subVector: CategoryVector
): LikedVideoInsight | null {
  if (likedVideos.length === 0) return null;

  const likeCounts: Partial<Record<CategoryKey, number>> = {};
  likedVideos.forEach(v => {
    likeCounts[v.customCategory] = (likeCounts[v.customCategory] || 0) + 1;
  });

  const topEntry = (Object.entries(likeCounts) as [CategoryKey, number][])
    .sort((a, b) => b[1] - a[1])[0];
  const topCategory = topEntry?.[0] || "entertainment";

  // 구독 벡터와 좋아요 벡터 코사인 유사도
  const likeVector: CategoryVector = {
    entertainment: 0, knowledge: 0, humor: 0, lifestyle: 0,
    music: 0, news: 0, food: 0, tech: 0,
  };
  const total = likedVideos.length;
  Object.entries(likeCounts).forEach(([k, v]) => {
    if (k in likeVector) likeVector[k as CategoryKey] = (v as number) / total;
  });
  const matchScore = Math.round(cosineSimilarity(subVector, likeVector) * 100);

  // 구독엔 없는데 좋아요엔 많은 카테고리
  const subKeys = Object.entries(subVector).sort((a, b) => b[1] - a[1]).map(e => e[0]);
  const likeKeys = Object.entries(likeCounts).sort((a, b) => (b[1] as number) - (a[1] as number)).map(e => e[0]);
  const surpriseCategory = likeKeys.find(k => !subKeys.slice(0, 3).includes(k)) as CategoryKey | undefined;

  const CATEGORY_LABELS_LOCAL: Record<string, string> = {
    entertainment: "엔터/게임", knowledge: "지식/교육", humor: "유머/밈",
    lifestyle: "라이프스타일", music: "음악", news: "뉴스/시사", food: "음식/요리", tech: "테크",
  };

  return {
    topCategory,
    topCategoryLabel: CATEGORY_LABELS_LOCAL[topCategory] || topCategory,
    matchScore,
    surpriseCategory,
    surpriseCategoryLabel: surpriseCategory ? CATEGORY_LABELS_LOCAL[surpriseCategory] : undefined,
    totalLiked: likedVideos.length,
  };
}

export function generateSoloComment(tasteType: TasteType, diversityIndex: number): { comment: string; commentType: string } {
  const typeLabel: Record<TasteType, string> = {
    knowledge: "지식 탐험가형", entertainment: "엔터 마니아형", humor: "유머 감성파형",
    music: "뮤직 비주얼형", lifestyle: "미식 라이프형", news: "시사 분석가형",
    tech: "테크 인사이더형", collector: "취향 콜렉터형",
  };
  const diversityLabel = diversityIndex >= 66 ? "다양형" : diversityIndex >= 36 ? "균형형" : "집중형";
  const comments: Record<TasteType, string> = {
    knowledge: "배우고 싶은 욕구가 강한 사람. 유튜브가 당신의 두 번째 도서관이에요.",
    entertainment: "콘텐츠 자체를 즐기는 진짜 팬. 알고리즘이 당신을 너무 잘 알고 있어요.",
    humor: "웃음에 진심인 사람. 당신의 유튜브 피드는 항상 유쾌할 거예요.",
    music: "감성과 리듬으로 세상을 느끼는 타입. 플레이리스트가 곧 일기예요.",
    lifestyle: "먹고 사는 것에 진지하게 진심인 사람. 삶의 질에 가장 많이 투자해요.",
    news: "세상 돌아가는 것에 예민하게 관심 있는 타입. 정보가 곧 힘이에요.",
    tech: "기술 트렌드를 누구보다 먼저 파악하는 얼리어답터. 미래를 먼저 보는 사람.",
    collector: "모든 것이 취향인 사람. 어디서든 재미를 발견하는 능력자 타입이에요.",
  };
  return {
    comment: comments[tasteType],
    commentType: `${typeLabel[tasteType]} · ${diversityLabel}`,
  };
}
