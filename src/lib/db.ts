import { supabaseAdmin } from "./supabase";
import type { MatchSession, MatchResult, SavedResult } from "@/types";
import { v4 as uuidv4 } from "uuid";

// ─── Match Sessions ───

export async function createSession(data: {
  userAId: string;
  userAName: string;
  notifyEmail: string;
  channelsAJson: string; // JSON stringified channel list
}): Promise<MatchSession> {
  const id = uuidv4();
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: row, error } = await supabaseAdmin
    .from("match_sessions")
    .insert({
      id,
      user_a_id: data.userAId,
      user_a_name: data.userAName,
      status: "waiting",
      notify_email: data.notifyEmail,
      channels_a: data.channelsAJson,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`createSession failed: ${error.message}`);
  return rowToSession(row);
}

export async function getSession(id: string): Promise<MatchSession | null> {
  const { data: row, error } = await supabaseAdmin
    .from("match_sessions")
    .select()
    .eq("id", id)
    .single();

  if (error || !row) return null;
  return rowToSession(row);
}

export async function updateSession(
  id: string,
  updates: Partial<{
    userBId: string;
    userBName: string;
    status: string;
    resultId: string;
  }>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.userBId) payload.user_b_id = updates.userBId;
  if (updates.userBName) payload.user_b_name = updates.userBName;
  if (updates.status) payload.status = updates.status;
  if (updates.resultId) payload.result_id = updates.resultId;

  const { error } = await supabaseAdmin
    .from("match_sessions")
    .update(payload)
    .eq("id", id);

  if (error) throw new Error(`updateSession failed: ${error.message}`);
}

export async function updateSessionChannelsB(
  id: string,
  data: {
    userBId: string;
    userBName: string;
    channelsBJson: string;
    bSoloResult: object;
  }
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("match_sessions")
    .update({
      user_b_id: data.userBId,
      user_b_name: data.userBName,
      channels_b: data.channelsBJson,
      b_solo_result: data.bSoloResult,
      status: "b_joined",
    })
    .eq("id", id);
  if (error) throw new Error(`updateSessionChannelsB failed: ${error.message}`);
}

// ─── Match Results ───

export async function saveResult(result: MatchResult): Promise<void> {
  const { error } = await supabaseAdmin.from("match_results").insert({
    id: result.id,
    match_session_id: result.matchSessionId,
    total_score: result.totalScore,
    channel_score: result.channelScore,
    category_score: result.categoryScore,
    curiosity_score: result.curiosityScore,
    humor_score: result.humorScore,
    pattern_score: result.patternScore,
    comment: result.comment,
    comment_type: result.commentType,
    common_channels: result.commonChannels,
    recommendations: result.recommendations,
    user_a_vector: result.userAVector,
    user_b_vector: result.userBVector,
    user_a_name: result.userAName,
    user_b_name: result.userBName,
    taste_type: result.tasteType ?? null,
    diversity_index: result.diversityIndex ?? null,
    friend_type: result.friendType ?? null,
    friend_type_reason: result.friendTypeReason ?? null,
    top_categories: result.topCategories ?? null,
    channel_count: (result as any).channelCount ?? null,
    channel_stats_data: (result as any).channelStatsData ?? null,
    liked_video_insight: (result as any).likedVideoInsight ?? null,
    curated_recs: (result as any).curatedRecs ?? null,
    created_at: result.createdAt,
  });
  if (error) throw new Error(`saveResult failed: ${error.message}`);
}

export async function getResultBySession(sessionId: string): Promise<MatchResult | null> {
  const { data: rows, error } = await supabaseAdmin
    .from("match_results")
    .select()
    .eq("match_session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error || !rows || rows.length === 0) return null;

  // 비교 결과 우선 반환 (솔로 결과는 user_b_name이 "나의 취향 분석")
  const comparison = rows.find((r: any) => r.user_b_name !== "나의 취향 분석");
  return rowToResult(comparison || rows[0]);
}

export async function getResult(id: string): Promise<MatchResult | null> {
  const { data: row, error } = await supabaseAdmin
    .from("match_results")
    .select()
    .eq("id", id)
    .single();

  if (error || !row) return null;
  return rowToResult(row);
}

// ─── Saved Results ───

export async function saveUserResult(userId: string, matchResultId: string): Promise<SavedResult> {
  const { data: resultRow, error: resultFindError } = await supabaseAdmin
    .from("match_results")
    .select()
    .eq("id", matchResultId)
    .single();

  if (resultFindError) throw new Error(`DB 조회 실패: ${resultFindError.message}`);
  if (!resultRow) throw new Error("Match result not found");

  const { data: row, error } = await supabaseAdmin
    .from("saved_results")
    .insert({
      id: uuidv4(),
      user_id: userId,
      match_result_id: matchResultId,
      saved_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`saveUserResult failed: ${error.message}`);

  return {
    id: row.id,
    userId: row.user_id,
    matchResultId: row.match_result_id,
    matchResult: rowToResult(resultRow),
    savedAt: row.saved_at,
  };
}

export async function getUserSavedResults(userId: string): Promise<SavedResult[]> {
  const { data: rows, error } = await supabaseAdmin
    .from("saved_results")
    .select("*, match_results(*)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error || !rows) return [];
  return rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    matchResultId: row.match_result_id,
    matchResult: rowToResult(row.match_results),
    savedAt: row.saved_at,
  }));
}

// ─── Row mappers ───

function rowToSession(row: any): MatchSession {
  return {
    id: row.id,
    userAId: row.user_a_id,
    userAName: row.user_a_name,
    userBId: row.user_b_id || undefined,
    userBName: row.user_b_name || undefined,
    status: row.status,
    notifyEmail: row.notify_email,
    resultId: row.result_id || undefined,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function rowToResult(row: any): MatchResult {
  return {
    id: row.id,
    matchSessionId: row.match_session_id,
    userAName: row.user_a_name,
    userBName: row.user_b_name,
    totalScore: row.total_score,
    channelScore: row.channel_score,
    categoryScore: row.category_score,
    curiosityScore: row.curiosity_score,
    humorScore: row.humor_score,
    patternScore: row.pattern_score,
    comment: row.comment,
    commentType: row.comment_type,
    commonChannels: row.common_channels || [],
    recommendations: row.recommendations || [],
    userAVector: row.user_a_vector || {},
    userBVector: row.user_b_vector || {},
    tasteType: row.taste_type ?? undefined,
    diversityIndex: row.diversity_index ?? undefined,
    friendType: row.friend_type ?? undefined,
    friendTypeReason: row.friend_type_reason ?? undefined,
    topCategories: row.top_categories ?? undefined,
    channelCount: row.channel_count ?? undefined,
    channelStatsData: row.channel_stats_data ?? undefined,
    likedVideoInsight: row.liked_video_insight ?? undefined,
    curatedRecs: row.curated_recs ?? undefined,
    createdAt: row.created_at,
  };
}
