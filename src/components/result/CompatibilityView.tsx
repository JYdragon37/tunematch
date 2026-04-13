"use client";
import type { MatchResult } from "@/types";
import { getScoreDetails } from "@/lib/algorithm";
import { CountUpScore } from "@/components/ui/CountUpScore";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { RadarChartComponent } from "@/components/charts/RadarChart";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  result: MatchResult;
  matchId: string;
  enriched?: any;
  onShare?: () => void;
  onSave?: () => void;
}

const TASTE_TYPE_MAP: Record<string, { emoji: string; label: string }> = {
  knowledge:     { emoji: "🧠", label: "지식 탐험가형" },
  entertainment: { emoji: "🎮", label: "엔터 마니아형" },
  humor:         { emoji: "😂", label: "유머 감성파형" },
  music:         { emoji: "🎵", label: "뮤직 비주얼형" },
  lifestyle:     { emoji: "🍳", label: "미식 라이프형" },
  news:          { emoji: "📰", label: "시사 분석가형" },
  tech:          { emoji: "💻", label: "테크 인사이더형" },
  collector:     { emoji: "🌈", label: "취향 콜렉터형" },
};

const CATEGORY_LABELS: Record<string, string> = {
  entertainment: "엔터/게임",
  knowledge:     "지식/교육",
  humor:         "유머/밈",
  lifestyle:     "라이프스타일",
  music:         "음악",
  news:          "뉴스/시사",
  food:          "음식/요리",
  tech:          "테크",
};

const SCORE_COLOR_MAP: Record<string, string> = {
  channel:   "#FF4D00",
  category:  "#F59E0B",
  curiosity: "#10B981",
  humor:     "#8B5CF6",
  pattern:   "#3B82F6",
};

function getCategoryBarColor(score: number): string {
  if (score >= 70) return "#10B981";
  if (score >= 40) return "#F59E0B";
  return "#6B7280";
}

// ─── Feature 1: 칭호 시스템 ───
function getTitleInfo(score: number): { emoji: string; title: string; desc: string; gradient: string } {
  if (score >= 85) return { emoji: "💫", title: "영혼의 짝",      desc: "같은 유튜브 우주에 살고 있어요",            gradient: "from-violet-400 to-purple-600" };
  if (score >= 70) return { emoji: "🎯", title: "취향 단짝",      desc: "서로를 알아가기 딱 좋은 사이",              gradient: "from-blue-400 to-indigo-600"  };
  if (score >= 55) return { emoji: "🔍", title: "발견의 친구",    desc: "서로에게 새로운 세계를 열어줄 수 있어요",    gradient: "from-teal-400 to-emerald-600" };
  if (score >= 40) return { emoji: "🚀", title: "탐험 파트너",    desc: "다름이 매력인 사이",                        gradient: "from-orange-400 to-amber-600" };
  return             { emoji: "🌌", title: "평행우주 주민",  desc: "이 만남 자체가 신기한 인연",                gradient: "from-slate-400 to-gray-600"   };
}

// ─── Feature 2: 뱃지 언락 조건 ───
function getUnlockedBadges(
  totalScore: number,
  commonChannels: MatchResult["commonChannels"],
  chemistryScores: { conversationScore: number; bingeDangerScore: number; varietyScore: number } | undefined,
  channelScore: number,
  categoryScore: number,
): { emoji: string; label: string }[] {
  const badges: { emoji: string; label: string }[] = [];
  if (totalScore >= 85)                          badges.push({ emoji: "💫", label: "완벽한 궁합" });
  if (commonChannels.length >= 15)               badges.push({ emoji: "📡", label: "채널 쌍둥이" });
  if (chemistryScores && chemistryScores.conversationScore >= 80) badges.push({ emoji: "🗣️", label: "대화 케미 폭발" });
  if (chemistryScores && chemistryScores.bingeDangerScore >= 80)  badges.push({ emoji: "🔥", label: "폭주 위험 커플" });
  if (chemistryScores && chemistryScores.varietyScore >= 80)      badges.push({ emoji: "🌈", label: "취향 부자들" });
  if (channelScore <= 3)                         badges.push({ emoji: "🌍", label: "다른 세계 주민" });
  if (categoryScore >= 45)                       badges.push({ emoji: "🎯", label: "카테고리 싱크로" });
  if (totalScore < 40)                           badges.push({ emoji: "🌌", label: "평행우주 탈출 필요" });
  return badges;
}

// ─── Feature 4: 케미 지수 설명 ───
function getChemistryDesc(type: "conversation" | "binge" | "variety", score: number): string {
  if (type === "conversation") {
    if (score >= 80) return "두 분이 만나면 대화가 끊이지 않을 거예요 🗣️";
    if (score >= 50) return "적당한 지적 교류가 가능한 사이에요";
    return "서로 다른 관심사로 새로운 자극을 줄 수 있어요";
  }
  if (type === "binge") {
    if (score >= 80) return "같이 있으면 밤새 영상 볼 위험이 있어요 🔥";
    if (score >= 50) return "취향이 겹치는 콘텐츠가 꽤 있어요";
    return "서로의 채널 취향이 꽤 달라서 폭주 위험은 낮아요";
  }
  // variety
  if (score >= 80) return "둘 다 폭넓은 취향을 가진 진짜 취향 부자들이에요 🌈";
  if (score >= 50) return "카테고리 다양성이 적당히 균형잡혀 있어요";
  return "한 장르에 집중하는 전문가형이에요";
}

// ─── Feature 7: 공통 채널 스토리 메시지 ───
function getCommonChannelStory(count: number): string {
  if (count === 0)  return "아직 겹치는 채널이 없지만, 서로 추천해줄 채널이 가득해요!";
  if (count <= 5)   return "희귀한 인연! 이 채널들만큼은 완벽히 통했어요";
  if (count >= 10)  return "이미 취향이 많이 닮아있었네요!";
  return "의외로 많은 채널이 겹쳐있어요!";
}

export function CompatibilityView({ result, matchId: _matchId, enriched, onShare, onSave }: Props) {
  const router = useRouter();
  const cd = result.comparisonData;
  const scoreDetails = getScoreDetails(result);

  const userATasteType = cd?.userATasteType;
  const userBTasteType = cd?.userBTasteType;
  const tasteA = userATasteType ? TASTE_TYPE_MAP[userATasteType] : null;
  const tasteB = userBTasteType ? TASTE_TYPE_MAP[userBTasteType] : null;

  // Feature 1
  const titleInfo = getTitleInfo(result.totalScore);

  // Feature 2
  const unlockedBadges = getUnlockedBadges(
    result.totalScore,
    result.commonChannels,
    cd?.chemistryScores,
    result.channelScore,
    result.categoryScore,
  );

  // Feature 4: 접기/펼치기 상태
  const [chemistryOpen, setChemistryOpen] = useState(false);

  return (
    <div className="space-y-6">

      {/* 섹션 1: 두 사람 취향 유형 나란히 */}
      <div className="bg-white rounded-3xl p-6 border border-border">
        <div className="flex items-center justify-around gap-4 mb-4">
          {/* A */}
          <div className="flex flex-col items-center text-center">
            <p className="text-sm font-semibold text-text-secondary mb-1">{result.userAName}</p>
            <div className="text-4xl mb-1">{tasteA?.emoji ?? "🌈"}</div>
            <p className="text-xs font-bold text-text-primary">{tasteA?.label ?? "취향 콜렉터형"}</p>
          </div>

          <div className="text-2xl text-text-muted font-light">×</div>

          {/* B */}
          <div className="flex flex-col items-center text-center">
            <p className="text-sm font-semibold text-text-secondary mb-1">{result.userBName}</p>
            <div className="text-4xl mb-1">{tasteB?.emoji ?? "🌈"}</div>
            <p className="text-xs font-bold text-text-primary">{tasteB?.label ?? "취향 콜렉터형"}</p>
          </div>
        </div>

        {cd && (
          <div className="text-center mt-2">
            <p className="font-black text-text-primary text-base">{cd.compatibilityType}</p>
            <p className="text-xs text-text-secondary mt-1">{cd.compatibilityTypeDesc}</p>
          </div>
        )}
      </div>

      {/* ── Feature 1: 칭호 시스템 ── */}
      <div className={`rounded-3xl p-6 bg-gradient-to-br ${titleInfo.gradient} text-white text-center`}>
        <div className="text-5xl mb-3">{titleInfo.emoji}</div>
        <p className="text-2xl font-black mb-1">{titleInfo.title}</p>
        <p className="text-sm opacity-90">{titleInfo.desc}</p>
      </div>

      {/* ── Feature 2: 뱃지 언락 ── */}
      {unlockedBadges.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-3">🏅 획득한 뱃지</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {unlockedBadges.map((badge) => (
              <span
                key={badge.label}
                className="shrink-0 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full px-3 py-1.5"
              >
                <span>{badge.emoji}</span>
                <span>{badge.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 섹션 2: 궁합 점수 카드 */}
      <div className="bg-white rounded-3xl p-6 border border-border text-center">
        <div className="text-8xl font-black text-primary mb-2">
          <CountUpScore target={result.totalScore} duration={2000} />
        </div>
        <p className="text-text-secondary font-medium mb-4">취향 싱크로율</p>
        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
          <span className="text-primary font-bold text-sm">{result.commentType}</span>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed">"{result.comment}"</p>
      </div>

      {/* 섹션 3: 케미 지수 (Feature 4: 설명 확장 포함) */}
      {cd?.chemistryScores && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-text-primary">케미 지수</h2>
            <button
              onClick={() => setChemistryOpen(v => !v)}
              className="text-xs text-primary font-semibold"
            >
              {chemistryOpen ? "설명 접기 ▲" : "설명 보기 ▼"}
            </button>
          </div>
          <div className="space-y-4">
            {/* 대화 케미 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-text-primary">대화 케미</span>
                <span className="text-sm font-bold" style={{ color: "#6366F1" }}>{cd.chemistryScores.conversationScore}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${cd.chemistryScores.conversationScore}%`, backgroundColor: "#6366F1" }}
                />
              </div>
              {chemistryOpen && (
                <p className="text-xs text-text-muted mt-1.5">{getChemistryDesc("conversation", cd.chemistryScores.conversationScore)}</p>
              )}
            </div>
            {/* 취향 다양성 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-text-primary">취향 다양성</span>
                <span className="text-sm font-bold" style={{ color: "#10B981" }}>{cd.chemistryScores.varietyScore}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${cd.chemistryScores.varietyScore}%`, backgroundColor: "#10B981" }}
                />
              </div>
              {chemistryOpen && (
                <p className="text-xs text-text-muted mt-1.5">{getChemistryDesc("variety", cd.chemistryScores.varietyScore)}</p>
              )}
            </div>
            {/* 폭주 위험도 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-text-primary">폭주 위험도 🔥</span>
                <span className="text-sm font-bold" style={{ color: "#EF4444" }}>{cd.chemistryScores.bingeDangerScore}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${cd.chemistryScores.bingeDangerScore}%`, backgroundColor: "#EF4444" }}
                />
              </div>
              {chemistryOpen && (
                <p className="text-xs text-text-muted mt-1.5">{getChemistryDesc("binge", cd.chemistryScores.bingeDangerScore)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Feature 3: 국가 다양성 비교 (enriched) ── */}
      {enriched?.countryDiversity && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-4">🌍 국가별 취향 비교</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* A */}
            <div className="bg-primary/5 rounded-2xl p-4">
              <p className="text-xs font-semibold text-primary mb-2 truncate">{result.userAName}</p>
              {(enriched.countryDiversity.userA as { flag: string; label: string; percent: number }[])
                ?.slice(0, 2)
                .map((item: { flag: string; label: string; percent: number }) => (
                  <p key={item.label} className="text-sm text-text-primary">
                    {item.flag} {item.label} <span className="font-bold">{item.percent}%</span>
                  </p>
                ))}
            </div>
            {/* B */}
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-blue-600 mb-2 truncate">{result.userBName}</p>
              {(enriched.countryDiversity.userB as { flag: string; label: string; percent: number }[])
                ?.slice(0, 2)
                .map((item: { flag: string; label: string; percent: number }) => (
                  <p key={item.label} className="text-sm text-text-primary">
                    {item.flag} {item.label} <span className="font-bold">{item.percent}%</span>
                  </p>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 섹션 4: 카테고리별 궁합 */}
      {cd?.categoryOverlap && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-5">카테고리별 궁합</h2>
          <div className="space-y-3">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const score = cd.categoryOverlap[key] ?? 0;
              const color = getCategoryBarColor(score);
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-text-primary">{label}</span>
                    <span className="text-sm font-bold" style={{ color }}>{score}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${score}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 섹션 5: 가장 비슷한 & 가장 다른 카테고리 */}
      {cd?.tasteComparison && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-4">취향 비교</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-green-600 font-semibold mb-2">💚 가장 비슷해요</p>
              <p className="text-sm font-bold text-text-primary">{cd.tasteComparison.mostSimilarLabel}</p>
              <p className="text-lg font-black text-green-600 mt-1">{cd.tasteComparison.mostSimilarScore}%</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-red-500 font-semibold mb-2">🔴 가장 달라요</p>
              <p className="text-sm font-bold text-text-primary">{cd.tasteComparison.mostDifferentLabel}</p>
              <p className="text-lg font-black text-red-500 mt-1">{cd.tasteComparison.mostDifferentScore}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Feature 6: 진짜 취향 vs 최근 취향 (enriched) ── */}
      {enriched?.realTaste && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-4">💎 진짜 취향 vs 최근 관심사</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* A */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-primary truncate">{result.userAName}</p>
              {enriched.realTaste.userA?.longTerm && (
                <div className="bg-violet-50 rounded-xl p-3">
                  <p className="text-xs text-violet-500 font-semibold mb-0.5">💎 진짜 취향</p>
                  <p className="text-sm font-bold text-text-primary">{enriched.realTaste.userA.longTerm}</p>
                </div>
              )}
              {enriched.realTaste.userA?.recent && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs text-amber-500 font-semibold mb-0.5">✨ 최근 관심사</p>
                  <p className="text-sm font-bold text-text-primary">{enriched.realTaste.userA.recent}</p>
                </div>
              )}
            </div>
            {/* B */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-blue-600 truncate">{result.userBName}</p>
              {enriched.realTaste.userB?.longTerm && (
                <div className="bg-violet-50 rounded-xl p-3">
                  <p className="text-xs text-violet-500 font-semibold mb-0.5">💎 진짜 취향</p>
                  <p className="text-sm font-bold text-text-primary">{enriched.realTaste.userB.longTerm}</p>
                </div>
              )}
              {enriched.realTaste.userB?.recent && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs text-amber-500 font-semibold mb-0.5">✨ 최근 관심사</p>
                  <p className="text-sm font-bold text-text-primary">{enriched.realTaste.userB.recent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 섹션 6: 궁합 스토리 */}
      {cd?.compatibilityStory && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-4">📖 우리의 유튜브 이야기</h2>
          <p className="text-sm text-text-secondary leading-relaxed italic">{cd.compatibilityStory}</p>
        </div>
      )}

      {/* 섹션 7: 취향 DNA 레이더 차트 */}
      <div className="bg-white rounded-3xl p-6 border border-border">
        <h2 className="font-bold text-text-primary mb-2">취향 DNA 비교</h2>
        <p className="text-xs text-text-muted mb-4">
          <span className="text-primary">●</span> {result.userAName}
          <span className="ml-3 text-blue-500">●</span> {result.userBName}
        </p>
        <RadarChartComponent
          vectorA={result.userAVector}
          vectorB={result.userBVector}
          nameA={result.userAName}
          nameB={result.userBName}
        />
      </div>

      {/* 섹션 8: 세부 항목 */}
      <div className="bg-white rounded-3xl p-6 border border-border">
        <h2 className="font-bold text-text-primary mb-5">세부 항목</h2>
        {scoreDetails.map((detail, i) => (
          <ScoreBar
            key={detail.key}
            label={detail.label}
            score={detail.score}
            maxScore={detail.maxScore}
            delay={i * 100}
            color={SCORE_COLOR_MAP[detail.key]}
          />
        ))}
      </div>

      {/* 섹션 9: 공통 구독 채널 (Feature 7: 스토리카드 개선) */}
      <div className="bg-white rounded-3xl p-6 border border-border">
        <h2 className="font-bold text-text-primary mb-1">
          공통 구독 채널 TOP {Math.min(result.commonChannels.length, 10)}
        </h2>
        <p className="text-xs text-text-muted mb-1">이 채널들이 두 분을 이어줬어요 ✨</p>
        <p className="text-xs text-primary font-semibold mb-4">
          {getCommonChannelStory(result.commonChannels.length)}
        </p>
        {result.commonChannels.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">공통 구독 채널이 없어요</p>
        ) : (
          <div className="space-y-3">
            {result.commonChannels.slice(0, 10).map((channel, i) => (
              <div key={channel.id} className="flex items-center gap-3">
                <span className="text-text-muted text-sm w-5 shrink-0">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                  {channel.title[0]}
                </div>
                <span className="text-text-primary text-sm font-medium flex-1 min-w-0 truncate">{channel.title}</span>
                <span className="text-xs text-text-muted bg-muted rounded-full px-2 py-0.5 shrink-0">
                  {CATEGORY_LABELS[channel.customCategory] || channel.customCategory}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Feature 8: 숨겨진 좋아요 공통점 (enriched) ── */}
      {enriched?.likedComparison?.hiddenCommonCategories &&
        (enriched.likedComparison.hiddenCommonCategories as string[]).length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-3">🤫 구독은 달라도, 좋아요는 통했어요!</h2>
          <div className="flex flex-wrap gap-2">
            {(enriched.likedComparison.hiddenCommonCategories as string[]).map((cat: string) => (
              <span
                key={cat}
                className="inline-flex items-center bg-rose-50 text-rose-600 text-xs font-semibold rounded-full px-3 py-1.5"
              >
                {CATEGORY_LABELS[cat] || cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Feature 11: 좋아요 A×B 비교 (enriched) ── */}
      {enriched?.likedComparison && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-primary">좋아요 취향 비교</h2>
            {enriched.likedComparison.syncScore != null && (
              <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-3 py-1">
                싱크로율 {enriched.likedComparison.syncScore}점
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* A */}
            <div>
              <p className="text-xs font-semibold text-primary mb-2 truncate">{result.userAName}</p>
              <div className="space-y-1.5">
                {(enriched.likedComparison.userATopCategories as { category: string; label: string; percent: number }[] | undefined)
                  ?.slice(0, 4)
                  .map((item: { category: string; label: string; percent: number }) => (
                    <div key={item.category} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-text-primary truncate">{item.label || CATEGORY_LABELS[item.category] || item.category}</span>
                      <span className="text-xs font-bold text-primary shrink-0">{item.percent}%</span>
                    </div>
                  ))}
              </div>
            </div>
            {/* B */}
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-2 truncate">{result.userBName}</p>
              <div className="space-y-1.5">
                {(enriched.likedComparison.userBTopCategories as { category: string; label: string; percent: number }[] | undefined)
                  ?.slice(0, 4)
                  .map((item: { category: string; label: string; percent: number }) => (
                    <div key={item.category} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-text-primary truncate">{item.label || CATEGORY_LABELS[item.category] || item.category}</span>
                      <span className="text-xs font-bold text-blue-600 shrink-0">{item.percent}%</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 섹션 10: 크로스 채널 추천 */}
      {(cd?.crossRecsFromA && cd.crossRecsFromA.length > 0) && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-4">
            🎁 {result.userAName}이 {result.userBName}에게 추천
          </h2>
          <div className="space-y-3">
            {cd.crossRecsFromA.map((channel) => (
              <div key={channel.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {channel.title[0]}
                </div>
                <span className="text-text-primary text-sm font-medium flex-1 min-w-0 truncate">{channel.title}</span>
                <span className="text-xs text-text-muted bg-muted rounded-full px-2 py-0.5 shrink-0">
                  {CATEGORY_LABELS[channel.customCategory] || channel.customCategory}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(cd?.crossRecsFromB && cd.crossRecsFromB.length > 0) && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-4">
            🎁 {result.userBName}이 {result.userAName}에게 추천
          </h2>
          <div className="space-y-3">
            {cd.crossRecsFromB.map((channel) => (
              <div key={channel.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                  {channel.title[0]}
                </div>
                <span className="text-text-primary text-sm font-medium flex-1 min-w-0 truncate">{channel.title}</span>
                <span className="text-xs text-text-muted bg-muted rounded-full px-2 py-0.5 shrink-0">
                  {CATEGORY_LABELS[channel.customCategory] || channel.customCategory}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 섹션 11: CTA 버튼들 */}
      <div className="space-y-3">
        <Button variant="primary" size="lg" fullWidth onClick={onShare}>📤 결과 카드 공유하기</Button>
        <Button variant="secondary" size="lg" fullWidth onClick={onSave}>💾 결과 저장하기</Button>
        <Button variant="ghost" size="lg" fullWidth onClick={() => router.push("/connect")}>🔄 다른 친구와 해보기</Button>
      </div>

    </div>
  );
}
