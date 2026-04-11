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

  // comparisonData 계산
  const tasteTypeA = classifyTasteType(vecA);
  const tasteTypeB = classifyTasteType(vecB);
  const { type: compatibilityType, desc: compatibilityTypeDesc } = getCompatibilityType(tasteTypeA, tasteTypeB);
  const comparisonData: import("@/types").ComparisonData = {
    categoryOverlap: calcCategoryOverlap(vecA, vecB),
    crossRecsFromA: calcCrossRecommendations(channelsA, channelsB, vecA, vecB).fromA,
    crossRecsFromB: calcCrossRecommendations(channelsA, channelsB, vecA, vecB).fromB,
    chemistryScores: calcChemistryScores(vecA, vecB),
    compatibilityType,
    compatibilityTypeDesc,
    compatibilityStory: generateCompatibilityStory(vecA, vecB, userAName, userBName, Math.min(100, totalScore)),
    tasteComparison: getTasteComparison(vecA, vecB),
    userATasteType: tasteTypeA,
    userBTasteType: tasteTypeB,
  };

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
    comparisonData,
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

function formatCount(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return `${n}`;
}

export function analyzeChannelStats(
  stats: ChannelStat[],
  subscriptions: Channel[],
  likedVideos?: import("./youtube").LikedVideo[]
): ChannelStatsData | null {
  if (stats.length === 0) return null;

  // stats에 이미 subscribedAt이 포함되어 있음 (fetchChannelStats에서 subDateMap 매핑)
  // subscriptions의 subscribedAt을 stats와 id로 매핑 (보강)
  const subDateMap = new Map<string, string>();
  subscriptions.forEach(s => {
    if ((s as any).subscribedAt) subDateMap.set(s.id, (s as any).subscribedAt);
  });

  const withSubs = stats.map(s => ({
    ...s,
    subscribedAt: s.subscribedAt || subDateMap.get(s.id) || undefined,
  }));

  const sorted = [...withSubs].sort((a, b) => b.subscriberCount - a.subscriberCount);
  const topSub = sorted[0];
  const smallestSub = sorted[sorted.length - 1];

  // 구독 날짜 정렬
  const withDates = withSubs.filter(s => s.subscribedAt);
  withDates.sort((a, b) => new Date(a.subscribedAt!).getTime() - new Date(b.subscribedAt!).getTime());
  const oldest = withDates[0];
  const newest = withDates[withDates.length - 1];

  // 소채널 (10만 이하) / 메가채널 (100만 이상)
  const hiddenFans = withSubs.filter(s => s.subscriberCount < 100_000 && s.subscriberCount > 0);
  const megaChannels = withSubs.filter(s => s.subscriberCount >= 1_000_000);
  const avgSubscriberCount = withSubs.length > 0
    ? Math.round(withSubs.reduce((sum, s) => sum + s.subscriberCount, 0) / withSubs.length)
    : 0;

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

  // ─── 추가 분석 ───

  // ① TOP 10 구독자 많은 채널
  const top10Subscribers = sorted.slice(0, 10).map(toItem);

  // ② 소채널 TOP 10 (구독자 적은 순)
  const top10Hidden = [...withSubs]
    .filter(s => s.subscriberCount > 0)
    .sort((a, b) => a.subscriberCount - b.subscriberCount)
    .slice(0, 10)
    .map(toItem);

  // ③ 메가채널 TOP 10 (유저 주요 국가 기준)
  const dominantCountry = countryDist[0]?.code || "KR";
  let top10Mega = [...megaChannels]
    .filter(s => (s.country || "") === dominantCountry)
    .sort((a, b) => b.subscriberCount - a.subscriberCount)
    .slice(0, 10)
    .map(toItem);
  // 해당 국가 채널이 3개 미만이면 전체로 폴백
  if (top10Mega.length < 3) {
    top10Mega = [...megaChannels]
      .sort((a, b) => b.subscriberCount - a.subscriberCount)
      .slice(0, 10)
      .map(toItem);
  }

  // ④ 연도별 구독 히스토리
  const yearCount: Record<number, number> = {};
  withSubs.forEach(s => {
    if (s.subscribedAt) {
      const year = new Date(s.subscribedAt).getFullYear();
      yearCount[year] = (yearCount[year] || 0) + 1;
    }
  });
  const yearDist = Object.entries(yearCount)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, count]) => ({ year: Number(year), count }));

  // ⑤ 구독 속도 (일 단위)
  let subSpeedDays = 0;
  if (withDates.length >= 2) {
    const spanMs = new Date(withDates[withDates.length - 1].subscribedAt!).getTime()
      - new Date(withDates[0].subscribedAt!).getTime();
    const spanDays = spanMs / (1000 * 60 * 60 * 24);
    subSpeedDays = Math.round(spanDays / (withDates.length - 1));
  }

  // ⑥ 구독자 규모 분포
  const bands = {
    nano:  withSubs.filter(s => s.subscriberCount < 10_000).length,       // ~1만
    small: withSubs.filter(s => s.subscriberCount >= 10_000 && s.subscriberCount < 100_000).length,  // 1~10만
    mid:   withSubs.filter(s => s.subscriberCount >= 100_000 && s.subscriberCount < 1_000_000).length, // 10~100만
    mega:  withSubs.filter(s => s.subscriberCount >= 1_000_000).length,   // 100만+
  };

  // ⑦ 국가별 대표 채널 TOP 3
  const countryTopChannels: Record<string, typeof withSubs[0][]> = {};
  withSubs.forEach(s => {
    const code = s.country || "KR";
    if (!countryTopChannels[code]) countryTopChannels[code] = [];
    countryTopChannels[code].push(s);
  });
  const countryRepresentatives = Object.entries(countryTopChannels)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([code, chs]) => ({
      code,
      label: { KR:"🇰🇷 한국", US:"🇺🇸 미국", JP:"🇯🇵 일본", GB:"🇬🇧 영국" }[code] || code,
      count: chs.length,
      topChannel: toItem(chs.sort((a, b) => b.subscriberCount - a.subscriberCount)[0]),
    }));

  // ⑨ 최근 1년 활동
  const oneYearAgo = Date.now() - 365 * 24 * 3600 * 1000;
  const recentSubCount = withSubs.filter(s =>
    s.subscribedAt && new Date(s.subscribedAt).getTime() > oneYearAgo
  ).length;

  // ⑩ 오랜 인연 (구독 날짜 오래된 순 TOP 10)
  const top10Oldest = withDates.slice(0, 10).map(toItem);

  // 📺 영상 가장 많이 올린 채널 TOP 10
  const top10ByVideoCount = [...withSubs]
    .filter(s => (s as any).videoCount > 0)
    .sort((a, b) => ((b as any).videoCount || 0) - ((a as any).videoCount || 0))
    .slice(0, 10)
    .map(s => ({ ...toItem(s), videoCount: (s as any).videoCount as number }));

  // 🔤 채널명 자주 나오는 키워드 TOP 10
  const stopWords = new Set(["the","a","an","of","and","in","for","to","is","on",
    "official","channel","tv","youtube","브이로그","채널","공식","유튜브","with","by"]);
  const wordCount: Record<string, number> = {};
  withSubs.forEach(s => {
    s.title.toLowerCase()
      .replace(/[^\w\s가-힣]/g, " ")
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.has(w) && isNaN(Number(w)))
      .forEach(w => { wordCount[w] = (wordCount[w] || 0) + 1; });
  });
  const topKeywords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // 🏃 가장 오래된 채널 TOP 10 (채널 개설일 기준)
  const top10OldestChannels = [...withSubs]
    .filter(s => (s as any).channelCreatedAt)
    .sort((a, b) =>
      new Date((a as any).channelCreatedAt).getTime() -
      new Date((b as any).channelCreatedAt).getTime()
    )
    .slice(0, 10)
    .map(s => ({
      ...toItem(s),
      channelCreatedAt: (s as any).channelCreatedAt as string,
      channelAgeYears: Math.floor(
        (Date.now() - new Date((s as any).channelCreatedAt).getTime()) / (365.25 * 24 * 3600 * 1000)
      ),
    }));

  // 🌙 평균 채널 나이 (채널 개설일 기준)
  const channelsWithAge = withSubs.filter(s => (s as any).channelCreatedAt);
  const avgChannelAgeYears = channelsWithAge.length > 0
    ? Math.round(
        channelsWithAge.reduce((sum, s) =>
          sum + (Date.now() - new Date((s as any).channelCreatedAt).getTime()) / (365.25 * 24 * 3600 * 1000)
        , 0) / channelsWithAge.length
      )
    : 0;

  // 🔮 나의 안목 채널 TOP 5 (일찍 구독 + 지금 구독자 많은 채널)
  // = 구독한 지 2년 이상 + 현재 구독자 100만 이상 채널
  const twoYearsAgo = Date.now() - 2 * 365.25 * 24 * 3600 * 1000;
  const earlyBirdChannels = withSubs
    .filter(s =>
      s.subscribedAt &&
      new Date(s.subscribedAt).getTime() < twoYearsAgo &&
      s.subscriberCount >= 1_000_000
    )
    .sort((a, b) => b.subscriberCount - a.subscriberCount)
    .slice(0, 10)
    .map(toItem);

  // ❤️ 좋아요 많이 누른 구독 채널 TOP 10
  const top10LikedChannels: Array<{ title: string; subscriberCount: number; formattedCount: string; likeCount: number }> = [];
  if (likedVideos && likedVideos.length > 0) {
    const subIdSet = new Set(subscriptions.map(c => c.id));
    const likeCounts = new Map<string, number>();
    likedVideos.forEach(v => {
      if (v.channelId && subIdSet.has(v.channelId)) {
        likeCounts.set(v.channelId, (likeCounts.get(v.channelId) || 0) + 1);
      }
    });
    const statsMap = new Map(withSubs.map(s => [s.id, s]));
    Array.from(likeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([id, count]) => {
        const stat = statsMap.get(id);
        const sub = subscriptions.find(c => c.id === id);
        if (stat || sub) {
          top10LikedChannels.push({
            title: stat?.title || sub?.title || id,
            subscriberCount: stat?.subscriberCount || 0,
            formattedCount: formatCount(stat?.subscriberCount || 0),
            likeCount: count,
          });
        }
      });
  }

  return {
    topSubscriber: toItem(topSub),
    smallestSubscriber: toItem(smallestSub),
    oldestSub: oldest ? toItem(oldest) : toItem(sorted[0]),
    newestSub: newest ? toItem(newest) : toItem(sorted[sorted.length - 1]),
    hiddenFanCount: hiddenFans.length,
    hiddenFanPercent: Math.round((hiddenFans.length / withSubs.length) * 100),
    megaChannelCount: megaChannels.length,
    megaChannelPercent: Math.round((megaChannels.length / withSubs.length) * 100),
    avgSubscriberCount,
    countryDist,
    dominantCountry,
    // 신규 필드
    top10Subscribers,
    top10Hidden,
    top10Mega,
    yearDist,
    subSpeedDays,
    subscriberBands: bands,
    countryRepresentatives,
    recentSubCount,
    top10Oldest,
    top10ByVideoCount,
    topKeywords,
    top10OldestChannels,
    avgChannelAgeYears,
    earlyBirdChannels,
    top10LikedChannels,
  } as any;
}

export function analyzeLikedVideos(
  likedVideos: LikedVideo[],
  subVector: CategoryVector,
  subscribedChannelIds?: Set<string>
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

  // 좋아요 카테고리 TOP 10
  const top10LikedCategories = (Object.entries(likeCounts) as [CategoryKey, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cat, count]) => ({
      category: cat,
      label: CATEGORY_LABELS_LOCAL[cat] || cat,
      count,
      percent: Math.round((count / likedVideos.length) * 100),
    }));

  // 구독 안 했는데 좋아요 누른 채널 채널ID 목록
  // (실제 채널 정보는 없으므로 videoId/title만)
  const nonSubLiked = likedVideos
    .filter((v: any) => v.channelId && !subscribedChannelIds?.has(v.channelId))
    .slice(0, 5);

  return {
    topCategory,
    topCategoryLabel: CATEGORY_LABELS_LOCAL[topCategory] || topCategory,
    matchScore,
    surpriseCategory,
    surpriseCategoryLabel: surpriseCategory ? CATEGORY_LABELS_LOCAL[surpriseCategory] : undefined,
    totalLiked: likedVideos.length,
    top10LikedCategories,
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

// ─── Compatibility Enrichment ───

const CATEGORY_LABELS_KO: Record<string, string> = {
  entertainment: "엔터/게임", knowledge: "지식/교육", humor: "유머/밈",
  lifestyle: "라이프스타일", music: "음악", news: "뉴스/시사", food: "음식/요리", tech: "테크",
};

export function calcCategoryOverlap(vecA: CategoryVector, vecB: CategoryVector): Record<string, number> {
  const keys = Object.keys(vecA) as (keyof CategoryVector)[];
  const result: Record<string, number> = {};
  keys.forEach(k => {
    result[k] = Math.round((1 - Math.abs(vecA[k] - vecB[k])) * 100);
  });
  return result;
}

export function calcChemistryScores(vecA: CategoryVector, vecB: CategoryVector): {
  conversationScore: number;
  varietyScore: number;
  bingeDangerScore: number;
} {
  const knowledgeAvg = (vecA.knowledge + vecB.knowledge) / 2;
  const newsAvg = (vecA.news + vecB.news) / 2;
  const conversationScore = Math.round((knowledgeAvg + newsAvg) * 100);

  const varietyScore = Math.round((calcDiversityIndex(vecA) + calcDiversityIndex(vecB)) / 2);

  const entAvg = (vecA.entertainment + vecB.entertainment) / 2;
  const humorAvg = (vecA.humor + vecB.humor) / 2;
  const bingeDangerScore = Math.round((entAvg + humorAvg) * 100);

  return {
    conversationScore: Math.min(100, conversationScore),
    varietyScore: Math.min(100, varietyScore),
    bingeDangerScore: Math.min(100, bingeDangerScore),
  };
}

export function calcCrossRecommendations(
  channelsA: Channel[],
  channelsB: Channel[],
  vecA: CategoryVector,
  vecB: CategoryVector
): { fromA: Channel[]; fromB: Channel[] } {
  const setA = new Set(channelsA.map(c => c.id));
  const setB = new Set(channelsB.map(c => c.id));

  // B 취향에 맞는 A의 독점 채널 (B 상위 카테고리 기준)
  const bTopCat = (Object.entries(vecB) as [string, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const fromA = channelsA
    .filter(c => !setB.has(c.id))
    .sort((a, b) => {
      const aMatch = a.customCategory === bTopCat ? 1 : 0;
      const bMatch = b.customCategory === bTopCat ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, 5);

  // A 취향에 맞는 B의 독점 채널
  const aTopCat = (Object.entries(vecA) as [string, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const fromB = channelsB
    .filter(c => !setA.has(c.id))
    .sort((a, b) => {
      const aMatch = a.customCategory === aTopCat ? 1 : 0;
      const bMatch = b.customCategory === aTopCat ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, 5);

  return { fromA, fromB };
}

export function getTasteComparison(vecA: CategoryVector, vecB: CategoryVector): {
  mostSimilar: string;
  mostDifferent: string;
  mostSimilarLabel: string;
  mostDifferentLabel: string;
  mostSimilarScore: number;
  mostDifferentScore: number;
} {
  const keys = Object.keys(vecA) as (keyof CategoryVector)[];
  let mostSimilar = keys[0];
  let mostDifferent = keys[0];
  let minDiff = Infinity;
  let maxDiff = -Infinity;

  keys.forEach(k => {
    const diff = Math.abs(vecA[k] - vecB[k]);
    if (diff < minDiff) { minDiff = diff; mostSimilar = k; }
    if (diff > maxDiff) { maxDiff = diff; mostDifferent = k; }
  });

  return {
    mostSimilar,
    mostDifferent,
    mostSimilarLabel: CATEGORY_LABELS_KO[mostSimilar] || mostSimilar,
    mostDifferentLabel: CATEGORY_LABELS_KO[mostDifferent] || mostDifferent,
    mostSimilarScore: Math.round((1 - minDiff) * 100),
    mostDifferentScore: Math.round((1 - maxDiff) * 100),
  };
}

const COMPATIBILITY_TYPE_MAP: Record<string, Record<string, { type: string; desc: string }>> = {
  tech: {
    tech:          { type: "테크 듀오", desc: "같은 기술 트렌드를 공유하는 완벽한 파트너예요" },
    knowledge:     { type: "테크 × 지식 탐구자", desc: "기술과 지식의 교집합. 대화 레벨이 딱 맞아요" },
    entertainment: { type: "테크 인사이더 × 엔터 마니아", desc: "진지함과 재미 사이. 서로를 채워주는 케미예요" },
    humor:         { type: "진지함 × 웃음", desc: "테크 이야기 중간에 갑자기 웃음이 터지는 사이예요" },
    music:         { type: "테크 × 감성 뮤직", desc: "코드와 멜로디, 전혀 다른 세계가 만났어요" },
    lifestyle:     { type: "테크 × 라이프스타일", desc: "효율과 삶의 질 사이에서 밸런스를 찾는 조합이에요" },
    news:          { type: "테크 분석가 × 시사 분석가", desc: "세상 돌아가는 걸 가장 빠르게 파악하는 듀오예요" },
    food:          { type: "테크 × 미식가", desc: "먹기 전에 그 음식의 영양성분을 검색하는 사이예요" },
    collector:     { type: "테크 × 취향 콜렉터", desc: "전문성과 다양성이 만난 흥미로운 조합이에요" },
  },
  knowledge: {
    knowledge:     { type: "지식 탐구 듀오", desc: "함께 있으면 대화가 끊이지 않는 지적 파트너예요" },
    entertainment: { type: "지식 × 엔터", desc: "배움에 재미를 더해주는 최고의 조합이에요" },
    humor:         { type: "지식 × 유머", desc: "진지한 대화 중 갑자기 웃음이 터지는 케미예요" },
    music:         { type: "지식 × 감성", desc: "머리와 감성이 만났어요. 대화의 깊이가 달라요" },
    lifestyle:     { type: "지식 × 라이프", desc: "이론과 실전이 만나는 알찬 조합이에요" },
    news:          { type: "지식 탐구자 × 시사 분석가", desc: "세상을 깊이 있게 이해하는 토론 파트너예요" },
    food:          { type: "지식 × 미식", desc: "요리의 과학을 함께 탐구하는 사이예요" },
    tech:          { type: "지식 × 테크", desc: "기술과 지식의 교집합. 영원히 대화가 끊기지 않아요" },
    collector:     { type: "지식 × 콜렉터", desc: "다양한 분야를 깊이 있게 탐구하는 파트너예요" },
  },
  entertainment: {
    entertainment: { type: "엔터 마니아 듀오", desc: "같이 있으면 콘텐츠가 끝이 없는 사이예요" },
    humor:         { type: "엔터 × 유머", desc: "같이 있으면 웃음이 끊이지 않는 최강 조합이에요" },
    music:         { type: "엔터 × 뮤직", desc: "보고 듣는 즐거움을 함께 나누는 사이예요" },
    lifestyle:     { type: "엔터 × 라이프", desc: "재미있게 사는 법을 함께 탐구하는 파트너예요" },
    news:          { type: "엔터 × 시사", desc: "재미와 정보 사이에서 절묘한 밸런스를 이루는 조합이에요" },
    food:          { type: "먹방 & 엔터 듀오", desc: "같이 영상 보며 먹는 게 최고의 데이트인 사이예요" },
    knowledge:     { type: "엔터 × 지식", desc: "재미에 깊이를 더해주는 알찬 케미예요" },
    tech:          { type: "엔터 마니아 × 테크", desc: "진지함과 재미 사이. 서로를 채워주는 케미예요" },
    collector:     { type: "엔터 × 콜렉터", desc: "취향의 스펙트럼이 넓어지는 재미있는 조합이에요" },
  },
  humor: {
    humor:         { type: "유머 코드 듀오", desc: "같이 있으면 배꼽이 빠지는 최강 조합이에요" },
    lifestyle:     { type: "유머 × 라이프", desc: "웃으며 맛있는 것 먹는 게 최고인 사이예요" },
    music:         { type: "유머 × 감성", desc: "웃음과 감성 사이에서 풍요로운 케미예요" },
    news:          { type: "유머 × 시사", desc: "세상을 웃으며 바라보는 유쾌한 파트너예요" },
    food:          { type: "유머 × 미식", desc: "먹방 보며 배꼽 빠지게 웃는 사이예요" },
    entertainment: { type: "유머 × 엔터", desc: "같이 있으면 웃음이 끊이지 않는 최강 조합이에요" },
    knowledge:     { type: "유머 × 지식", desc: "진지한 대화 중 갑자기 웃음이 터지는 케미예요" },
    tech:          { type: "유머 × 테크", desc: "테크 이야기 중간에 갑자기 웃음이 터지는 사이예요" },
    collector:     { type: "유머 × 콜렉터", desc: "어디서든 재미를 찾아내는 유쾌한 파트너예요" },
  },
  music: {
    music:         { type: "뮤직 감성 듀오", desc: "같은 음악을 들으며 같은 감성을 느끼는 사이예요" },
    lifestyle:     { type: "뮤직 × 라이프", desc: "음악과 함께 삶을 즐기는 감성 파트너예요" },
    food:          { type: "뮤직 × 미식", desc: "좋은 음악과 좋은 음식. 감성이 통하는 사이예요" },
    entertainment: { type: "뮤직 × 엔터", desc: "보고 듣는 즐거움을 함께 나누는 사이예요" },
    knowledge:     { type: "뮤직 × 지식", desc: "머리와 감성이 만났어요. 대화의 깊이가 달라요" },
    humor:         { type: "뮤직 × 유머", desc: "웃음과 감성 사이에서 풍요로운 케미예요" },
    news:          { type: "뮤직 × 시사", desc: "감성과 현실 사이의 균형을 잡아주는 조합이에요" },
    tech:          { type: "뮤직 × 테크", desc: "코드와 멜로디, 전혀 다른 세계가 만났어요" },
    collector:     { type: "뮤직 × 콜렉터", desc: "다양한 취향에 감성을 더해주는 조합이에요" },
  },
  lifestyle: {
    lifestyle:     { type: "라이프스타일 듀오", desc: "삶을 즐기는 방법이 비슷한 베프 조합이에요" },
    food:          { type: "라이프 × 미식", desc: "먹고 즐기는 모든 것을 함께 탐구하는 파트너예요" },
    music:         { type: "라이프 × 뮤직", desc: "음악과 함께 삶을 즐기는 감성 파트너예요" },
    entertainment: { type: "라이프 × 엔터", desc: "재미있게 사는 법을 함께 탐구하는 파트너예요" },
    humor:         { type: "라이프 × 유머", desc: "웃으며 맛있는 것 먹는 게 최고인 사이예요" },
    knowledge:     { type: "라이프 × 지식", desc: "이론과 실전이 만나는 알찬 조합이에요" },
    news:          { type: "라이프 × 시사", desc: "현실적인 시각으로 세상을 바라보는 파트너예요" },
    tech:          { type: "라이프 × 테크", desc: "효율과 삶의 질 사이에서 밸런스를 찾는 조합이에요" },
    collector:     { type: "라이프 × 콜렉터", desc: "다양한 취향으로 삶을 풍요롭게 만드는 파트너예요" },
  },
  news: {
    news:          { type: "시사 분석가 듀오", desc: "세상 돌아가는 걸 누구보다 빠르게 파악하는 듀오예요" },
    knowledge:     { type: "시사 × 지식", desc: "세상을 깊이 있게 이해하는 토론 파트너예요" },
    tech:          { type: "시사 × 테크", desc: "세상 돌아가는 걸 가장 빠르게 파악하는 듀오예요" },
    entertainment: { type: "시사 × 엔터", desc: "재미와 정보 사이에서 절묘한 밸런스를 이루는 조합이에요" },
    humor:         { type: "시사 × 유머", desc: "세상을 웃으며 바라보는 유쾌한 파트너예요" },
    music:         { type: "시사 × 뮤직", desc: "감성과 현실 사이의 균형을 잡아주는 조합이에요" },
    lifestyle:     { type: "시사 × 라이프", desc: "현실적인 시각으로 세상을 바라보는 파트너예요" },
    food:          { type: "시사 × 미식", desc: "세상 걱정을 맛있는 것 먹으며 해소하는 사이예요" },
    collector:     { type: "시사 × 콜렉터", desc: "다양한 관점으로 세상을 이해하는 파트너예요" },
  },
  food: {
    food:          { type: "미식가 듀오", desc: "맛있는 것을 함께 탐구하는 최고의 파트너예요" },
    lifestyle:     { type: "미식 × 라이프", desc: "먹고 즐기는 모든 것을 함께 탐구하는 파트너예요" },
    humor:         { type: "미식 × 유머", desc: "먹방 보며 배꼽 빠지게 웃는 사이예요" },
    music:         { type: "미식 × 뮤직", desc: "좋은 음악과 좋은 음식. 감성이 통하는 사이예요" },
    entertainment: { type: "미식 × 엔터", desc: "같이 영상 보며 먹는 게 최고의 데이트인 사이예요" },
    knowledge:     { type: "미식 × 지식", desc: "요리의 과학을 함께 탐구하는 사이예요" },
    news:          { type: "미식 × 시사", desc: "세상 걱정을 맛있는 것 먹으며 해소하는 사이예요" },
    tech:          { type: "미식 × 테크", desc: "먹기 전에 그 음식의 영양성분을 검색하는 사이예요" },
    collector:     { type: "미식 × 콜렉터", desc: "다양한 취향으로 식탁을 풍요롭게 만드는 파트너예요" },
  },
  collector: {
    collector:     { type: "취향 콜렉터 듀오", desc: "모든 것이 취향인 두 사람. 유튜브 알고리즘도 당황하는 조합이에요" },
    tech:          { type: "콜렉터 × 테크", desc: "전문성과 다양성이 만난 흥미로운 조합이에요" },
    knowledge:     { type: "콜렉터 × 지식", desc: "다양한 분야를 깊이 있게 탐구하는 파트너예요" },
    entertainment: { type: "콜렉터 × 엔터", desc: "취향의 스펙트럼이 넓어지는 재미있는 조합이에요" },
    humor:         { type: "콜렉터 × 유머", desc: "어디서든 재미를 찾아내는 유쾌한 파트너예요" },
    music:         { type: "콜렉터 × 뮤직", desc: "다양한 취향에 감성을 더해주는 조합이에요" },
    lifestyle:     { type: "콜렉터 × 라이프", desc: "다양한 취향으로 삶을 풍요롭게 만드는 파트너예요" },
    news:          { type: "콜렉터 × 시사", desc: "다양한 관점으로 세상을 이해하는 파트너예요" },
    food:          { type: "콜렉터 × 미식", desc: "다양한 취향으로 식탁을 풍요롭게 만드는 파트너예요" },
  },
};

export function getCompatibilityType(
  tasteTypeA: string,
  tasteTypeB: string
): { type: string; desc: string } {
  const map = COMPATIBILITY_TYPE_MAP[tasteTypeA] || COMPATIBILITY_TYPE_MAP.collector;
  return map[tasteTypeB] || map.collector || { type: "독특한 조합", desc: "예측 불가능한 재미있는 케미예요" };
}

const STORY_TEMPLATES = [
  (aName: string, bName: string, topA: string, topB: string, score: number) =>
    score >= 75
      ? `${aName}와 ${bName}는 유튜브에서 나란히 앉아도 어색하지 않을 사이예요. ${topA}과 ${topB}을 오가며 서로의 피드를 공유하다 보면 시간이 어떻게 가는지 모르는 케미예요.`
      : `${aName}의 ${topA}와 ${bName}의 ${topB}는 언뜻 달라 보이지만, 같이 있으면 서로의 알고리즘에서 못 보던 채널을 발견하게 되는 사이예요.`,
  (aName: string, bName: string, topA: string, topB: string, score: number) =>
    score >= 60
      ? `${aName}은 ${topA} 채널로 피드를 채우고, ${bName}은 ${topB}로 하루를 시작해요. 다른 것 같아도 "이거 봤어?" 한 마디에 둘 다 탭을 바꾸는 사이예요.`
      : `${aName}과 ${bName}의 유튜브 피드는 다른 우주처럼 보이지만, 바로 그래서 같이 있으면 볼 게 두 배가 되는 신기한 조합이에요.`,
];

export function generateCompatibilityStory(
  vecA: CategoryVector,
  vecB: CategoryVector,
  userAName: string,
  userBName: string,
  totalScore: number
): string {
  const topA = CATEGORY_LABELS_KO[(Object.entries(vecA) as [string, number][]).sort((a,b) => b[1]-a[1])[0]?.[0]] || "다양한 콘텐츠";
  const topB = CATEGORY_LABELS_KO[(Object.entries(vecB) as [string, number][]).sort((a,b) => b[1]-a[1])[0]?.[0]] || "다양한 콘텐츠";
  const idx = totalScore >= 60 ? 0 : 1;
  return STORY_TEMPLATES[idx](userAName, userBName, topA, topB, totalScore);
}
