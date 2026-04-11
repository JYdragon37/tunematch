import type { Channel, CategoryKey, CategoryVector, MatchResult, ScoreDetail } from "@/types";
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
