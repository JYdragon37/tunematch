/**
 * Mock Store - Supabase 대신 인메모리 스토어 사용
 * 실제 Supabase 연동 시 이 파일의 함수들을 Supabase 쿼리로 교체
 */
import type { MatchSession, MatchResult, SavedResult } from "@/types";
import { v4 as uuidv4 } from "uuid";

// 인메모리 스토어
const matchSessions = new Map<string, MatchSession>();
const matchResults = new Map<string, MatchResult>();
const savedResults = new Map<string, SavedResult>();

// 세션 저장된 결과 인덱스
const sessionToResult = new Map<string, string>(); // sessionId → resultId

export const mockStore = {
  // Match Sessions
  createSession(data: Omit<MatchSession, "id" | "createdAt" | "expiresAt">): MatchSession {
    const id = uuidv4();
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const session: MatchSession = {
      ...data,
      id,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    matchSessions.set(id, session);
    return session;
  },

  getSession(id: string): MatchSession | null {
    return matchSessions.get(id) || null;
  },

  updateSession(id: string, updates: Partial<MatchSession>): MatchSession | null {
    const session = matchSessions.get(id);
    if (!session) return null;
    const updated = { ...session, ...updates };
    matchSessions.set(id, updated);
    return updated;
  },

  // Match Results
  saveResult(result: MatchResult): MatchResult {
    matchResults.set(result.id, result);
    sessionToResult.set(result.matchSessionId, result.id);
    return result;
  },

  getResult(id: string): MatchResult | null {
    return matchResults.get(id) || null;
  },

  getResultBySession(sessionId: string): MatchResult | null {
    const resultId = sessionToResult.get(sessionId);
    if (!resultId) return null;
    return matchResults.get(resultId) || null;
  },

  // Saved Results
  saveUserResult(userId: string, matchResultId: string): SavedResult {
    const resultId = matchResults.get(matchResultId);
    if (!resultId) throw new Error("Match result not found");

    const saved: SavedResult = {
      id: uuidv4(),
      userId,
      matchResultId,
      matchResult: resultId,
      savedAt: new Date().toISOString(),
    };
    savedResults.set(saved.id, saved);
    return saved;
  },

  getUserSavedResults(userId: string): SavedResult[] {
    return Array.from(savedResults.values()).filter((r) => r.userId === userId);
  },
};
