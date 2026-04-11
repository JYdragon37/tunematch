export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  googleId?: string;
}

export interface Channel {
  id: string;
  title: string;
  thumbnail: string;
  subscriberCount?: string;
  categoryId: string;
  customCategory: CategoryKey;
  description?: string;
}

export type CategoryKey =
  | "entertainment"
  | "knowledge"
  | "humor"
  | "lifestyle"
  | "music"
  | "news"
  | "food"
  | "tech";

export interface CategoryVector {
  entertainment: number;
  knowledge: number;
  humor: number;
  lifestyle: number;
  music: number;
  news: number;
  food: number;
  tech: number;
}

export type MatchStatus = "waiting" | "analyzing" | "done" | "expired";

export interface MatchSession {
  id: string;
  userAId: string;
  userAName: string;
  userBId?: string;
  userBName?: string;
  status: MatchStatus;
  notifyEmail: string;
  resultId?: string;
  createdAt: string;
  expiresAt: string;
}

export interface ScoreDetail {
  label: string;
  score: number;
  maxScore: number;
  key: string;
}

export interface MatchResult {
  id: string;
  matchSessionId: string;
  userAName: string;
  userBName: string;
  totalScore: number;
  channelScore: number;
  categoryScore: number;
  curiosityScore: number;
  humorScore: number;
  patternScore: number;
  comment: string;
  commentType: string;
  commonChannels: Channel[];
  recommendations: Channel[];
  userAVector: CategoryVector;
  userBVector: CategoryVector;
  createdAt: string;
  tasteType?: TasteType;
  diversityIndex?: number;
  friendType?: TasteType;
  friendTypeReason?: string;
  topCategories?: TopCategory[];
  channelCount?: number;  // 총 구독 채널 수
}

export interface SavedResult {
  id: string;
  userId: string;
  matchResultId: string;
  matchResult: MatchResult;
  savedAt: string;
}

export type CardStyle = "dark" | "light" | "color";

// ─── Solo Taste Analysis Types ───

export type TasteType =
  | "knowledge"
  | "entertainment"
  | "humor"
  | "music"
  | "lifestyle"
  | "news"
  | "tech"
  | "collector";

export interface TopCategory {
  key: CategoryKey;
  label: string;
  percentage: number;
  emoji: string;
}

export const TASTE_TYPE_META: Record<TasteType, {
  emoji: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  knowledge:     { emoji: "🧠", label: "지식 탐험가형", description: "배우고 이해하는 데 진심인 사람. 유튜브가 두 번째 교과서예요.", color: "#6366F1", bgColor: "#EEF2FF" },
  entertainment: { emoji: "🎮", label: "엔터 마니아형", description: "콘텐츠 자체를 즐기는 진짜 팬. 알고리즘이 친구 같은 사람.", color: "#F59E0B", bgColor: "#FFFBEB" },
  humor:         { emoji: "😂", label: "유머 감성파형", description: "웃음에 진심인 사람. 당신의 피드는 항상 유쾌해요.", color: "#EF4444", bgColor: "#FEF2F2" },
  music:         { emoji: "🎵", label: "뮤직 비주얼형", description: "감성과 리듬으로 세상을 느끼는 타입. 취향의 색깔이 선명해요.", color: "#EC4899", bgColor: "#FDF2F8" },
  lifestyle:     { emoji: "🍳", label: "미식 라이프형", description: "먹고 사는 것에 진지하게 진심인 사람. 삶의 질에 투자해요.", color: "#10B981", bgColor: "#ECFDF5" },
  news:          { emoji: "📰", label: "시사 분석가형", description: "세상 돌아가는 것에 예민하게 관심 있는 타입.", color: "#64748B", bgColor: "#F8FAFC" },
  tech:          { emoji: "💻", label: "테크 인사이더형", description: "기술 트렌드를 먼저 파악하는 얼리어답터.", color: "#3B82F6", bgColor: "#EFF6FF" },
  collector:     { emoji: "🌈", label: "취향 콜렉터형", description: "특정 장르 없이 넓게 보는 다양성의 왕. 모든 것이 취향이에요.", color: "#8B5CF6", bgColor: "#F5F3FF" },
};
