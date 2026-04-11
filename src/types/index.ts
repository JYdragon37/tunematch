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
}

export interface SavedResult {
  id: string;
  userId: string;
  matchResultId: string;
  matchResult: MatchResult;
  savedAt: string;
}

export type CardStyle = "dark" | "light" | "color";
