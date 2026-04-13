"use client";
import type { MatchResult } from "@/types";
import { getScoreDetails } from "@/lib/algorithm";
import { CountUpScore } from "@/components/ui/CountUpScore";
import { RadarChartComponent } from "@/components/charts/RadarChart";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  result: MatchResult;
  matchId: string;
  enriched?: any;
  onShare?: () => void;
  onSave?: () => void;
}

// ─── 상수 맵 ───────────────────────────────────────────────
const TASTE_TYPE_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  knowledge:     { emoji: "🧠", label: "지식 탐험가형",   color: "#6366F1" },
  entertainment: { emoji: "🎮", label: "엔터 마니아형",   color: "#F59E0B" },
  humor:         { emoji: "😂", label: "유머 감성파형",   color: "#EF4444" },
  music:         { emoji: "🎵", label: "뮤직 비주얼형",   color: "#EC4899" },
  lifestyle:     { emoji: "🍳", label: "미식 라이프형",   color: "#10B981" },
  news:          { emoji: "📰", label: "시사 분석가형",   color: "#64748B" },
  tech:          { emoji: "💻", label: "테크 인사이더형", color: "#3B82F6" },
  collector:     { emoji: "🌈", label: "취향 콜렉터형",   color: "#8B5CF6" },
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

// ─── 헬퍼 함수들 ───────────────────────────────────────────

function getTitleInfo(score: number): {
  emoji: string; title: string; desc: string;
  gradientFrom: string; gradientTo: string;
} {
  if (score >= 85) return { emoji: "💫", title: "영혼의 짝",     desc: "같은 유튜브 우주에 살고 있어요",          gradientFrom: "#7C3AED", gradientTo: "#4F46E5" };
  if (score >= 70) return { emoji: "🎯", title: "취향 단짝",     desc: "서로를 알아가기 딱 좋은 사이",            gradientFrom: "#2563EB", gradientTo: "#4F46E5" };
  if (score >= 55) return { emoji: "🔍", title: "발견의 친구",   desc: "서로에게 새로운 세계를 열어줄 수 있어요",  gradientFrom: "#059669", gradientTo: "#0891B2" };
  if (score >= 40) return { emoji: "🚀", title: "탐험 파트너",   desc: "다름이 매력인 사이",                      gradientFrom: "#D97706", gradientTo: "#EA580C" };
  return             { emoji: "🌌", title: "평행우주 주민", desc: "이 만남 자체가 신기한 인연",              gradientFrom: "#475569", gradientTo: "#334155" };
}

function getScoreGradientBg(score: number): string {
  if (score >= 85) return "from-violet-500/15 via-white to-indigo-50/40";
  if (score >= 70) return "from-blue-500/15 via-white to-indigo-50/40";
  if (score >= 55) return "from-emerald-500/15 via-white to-teal-50/40";
  if (score >= 40) return "from-amber-500/15 via-white to-orange-50/40";
  return "from-slate-400/15 via-white to-gray-50/40";
}

function getScoreAccentColor(score: number): string {
  if (score >= 85) return "#7C3AED";
  if (score >= 70) return "#2563EB";
  if (score >= 55) return "#059669";
  if (score >= 40) return "#D97706";
  return "#475569";
}

function getUnlockedBadges(
  totalScore: number,
  commonChannels: MatchResult["commonChannels"],
  chemistryScores: { conversationScore: number; bingeDangerScore: number; varietyScore: number } | undefined,
  channelScore: number,
  categoryScore: number,
): { emoji: string; label: string }[] {
  const badges: { emoji: string; label: string }[] = [];
  if (totalScore >= 85)                                              badges.push({ emoji: "💫", label: "완벽한 궁합" });
  if (commonChannels.length >= 15)                                   badges.push({ emoji: "📡", label: "채널 쌍둥이" });
  if (chemistryScores && chemistryScores.conversationScore >= 80)   badges.push({ emoji: "🗣️", label: "대화 케미 폭발" });
  if (chemistryScores && chemistryScores.bingeDangerScore >= 80)    badges.push({ emoji: "🔥", label: "폭주 위험 커플" });
  if (chemistryScores && chemistryScores.varietyScore >= 80)        badges.push({ emoji: "🌈", label: "취향 부자들" });
  if (channelScore <= 3)                                             badges.push({ emoji: "🌍", label: "다른 세계 주민" });
  if (categoryScore >= 45)                                           badges.push({ emoji: "🎯", label: "카테고리 싱크로" });
  if (totalScore < 40)                                               badges.push({ emoji: "🌌", label: "평행우주 탈출 필요" });
  return badges;
}

function getChemistryCardInfo(type: "conversation" | "binge" | "variety", score: number): {
  emoji: string; title: string; tagline: string; bgColor: string; accentColor: string; barColor: string;
} {
  if (type === "conversation") {
    const high   = score >= 80;
    const mid    = score >= 50;
    return {
      emoji:       "🗣️",
      title:       "대화 케미",
      tagline:     high ? "함께라면 대화가 끊이지 않아요" : mid ? "적당한 지적 교류가 가능해요" : "새로운 자극을 주고받을 수 있어요",
      bgColor:     "#EEF2FF",
      accentColor: "#6366F1",
      barColor:    "#6366F1",
    };
  }
  if (type === "binge") {
    const high = score >= 80;
    const mid  = score >= 50;
    return {
      emoji:       "🔥",
      title:       "폭주 위험도",
      tagline:     high ? "같이 있으면 밤새 영상 볼 수도..." : mid ? "취향이 겹치는 콘텐츠가 꽤 있어요" : "폭주 위험은 낮아요, 안심!",
      bgColor:     "#FEF2F2",
      accentColor: "#EF4444",
      barColor:    "#EF4444",
    };
  }
  // variety
  const high = score >= 80;
  const mid  = score >= 50;
  return {
    emoji:       "🌈",
    title:       "취향 다양성",
    tagline:     high ? "두 분 모두 폭넓은 취향이에요" : mid ? "카테고리 다양성이 균형잡혀 있어요" : "한 장르에 집중하는 전문가형이에요",
    bgColor:     "#ECFDF5",
    accentColor: "#10B981",
    barColor:    "#10B981",
  };
}

function getCommonChannelStory(count: number): string {
  if (count === 0)  return "아직 겹치는 채널이 없지만, 서로 추천해줄 채널이 가득해요!";
  if (count <= 5)   return "희귀한 인연! 이 채널들만큼은 완벽히 통했어요";
  if (count >= 10)  return "이미 취향이 많이 닮아있었네요!";
  return "의외로 많은 채널이 겹쳐있어요!";
}

function getCategoryRecommendReason(category: string): string {
  const map: Record<string, string> = {
    entertainment: "취향에 딱 맞는 채널이에요",
    knowledge:     "새로운 시각을 넓혀줄 거예요",
    humor:         "같이 보면 웃음이 두 배예요",
    lifestyle:     "라이프스타일에 영감을 줄 채널이에요",
    music:         "감성이 통하는 채널이에요",
    news:          "세상을 보는 눈을 키워줘요",
    food:          "먹방 취향을 자극할 채널이에요",
    tech:          "기술 트렌드를 함께 파악해요",
  };
  return map[category] ?? "취향이 잘 맞는 채널이에요";
}

// ─── 서브 컴포넌트 ─────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-text-primary">{children}</h2>
  );
}

interface ChemistryCardProps {
  type: "conversation" | "binge" | "variety";
  score: number;
}
function ChemistryCard({ type, score }: ChemistryCardProps) {
  const info = getChemistryCardInfo(type, score);
  return (
    <div
      className="shrink-0 w-52 rounded-2xl p-4 flex flex-col gap-2"
      style={{ backgroundColor: info.bgColor }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xl">{info.emoji}</span>
        <span className="text-lg font-black" style={{ color: info.accentColor }}>{score}%</span>
      </div>
      <p className="text-sm font-bold text-text-primary">{info.title}</p>
      <p className="text-xs text-text-secondary leading-snug">{info.tagline}</p>
      {/* 미니 바 */}
      <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden mt-auto">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: info.barColor }}
        />
      </div>
    </div>
  );
}

interface GiftChannelRowProps {
  title: string;
  category: string;
  accentColor: string;
  bgColor: string;
}
function GiftChannelRow({ title, category, accentColor, bgColor }: GiftChannelRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
        style={{ backgroundColor: bgColor, color: accentColor }}
      >
        {title[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{title}</p>
        <p className="text-xs text-text-muted mt-0.5">{getCategoryRecommendReason(category)}</p>
      </div>
      <span
        className="shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 self-center"
        style={{ backgroundColor: bgColor, color: accentColor }}
      >
        {CATEGORY_LABELS[category] ?? category}
      </span>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export function CompatibilityView({ result, matchId: _matchId, enriched, onShare, onSave }: Props) {
  const router = useRouter();
  const cd = result.comparisonData;
  const scoreDetails = getScoreDetails(result);

  const userATasteType = cd?.userATasteType;
  const userBTasteType = cd?.userBTasteType;
  const tasteA = userATasteType ? TASTE_TYPE_MAP[userATasteType] : null;
  const tasteB = userBTasteType ? TASTE_TYPE_MAP[userBTasteType] : null;

  const titleInfo    = getTitleInfo(result.totalScore);
  const accentColor  = getScoreAccentColor(result.totalScore);

  const unlockedBadges = getUnlockedBadges(
    result.totalScore,
    result.commonChannels,
    cd?.chemistryScores,
    result.channelScore,
    result.categoryScore,
  );

  // 카테고리별 궁합 접기
  const [categoryOpen, setCategoryOpen] = useState(false);

  // 카테고리별 점수 정렬 (가장 비슷 + 가장 달라 강조용)
  const sortedCategories = cd?.categoryOverlap
    ? Object.entries(cd.categoryOverlap).sort((a, b) => b[1] - a[1])
    : [];
  const topCategory    = sortedCategories[0];
  const bottomCategory = sortedCategories[sortedCategories.length - 1];

  return (
    <div className="space-y-4">

      {/* ══════════════════════════════════════════
          1. 히어로 카드: 두 사람 × 점수 × 칭호
         ══════════════════════════════════════════ */}
      <div
        className={`rounded-3xl p-6 bg-gradient-to-br ${getScoreGradientBg(result.totalScore)} border border-border shadow-sm animate-fade-in`}
      >
        {/* 두 사람 이름 */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {/* A */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm"
              style={{ backgroundColor: tasteA?.color ? `${tasteA.color}20` : "#FF4D0015" }}
            >
              {tasteA?.emoji ?? "🌈"}
            </div>
            <p className="text-xs font-bold text-text-primary max-w-[72px] text-center truncate">{result.userAName}</p>
            {tasteA && (
              <p className="text-[10px] text-text-muted text-center leading-tight">{tasteA.label}</p>
            )}
          </div>

          {/* 중앙 점수 */}
          <div className="flex flex-col items-center gap-1 px-4">
            <p className="text-[10px] font-semibold text-text-muted tracking-widest uppercase">SYNC</p>
            <div
              className="text-6xl font-black leading-none tabular-nums"
              style={{ color: accentColor }}
            >
              <CountUpScore target={result.totalScore} duration={2000} />
            </div>
            <p className="text-xs font-semibold text-text-muted">/ 100</p>
          </div>

          {/* B */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm"
              style={{ backgroundColor: tasteB?.color ? `${tasteB.color}20` : "#3B82F615" }}
            >
              {tasteB?.emoji ?? "🌈"}
            </div>
            <p className="text-xs font-bold text-text-primary max-w-[72px] text-center truncate">{result.userBName}</p>
            {tasteB && (
              <p className="text-[10px] text-text-muted text-center leading-tight">{tasteB.label}</p>
            )}
          </div>
        </div>

        {/* 칭호 */}
        <div className="text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 mb-3"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            <span className="text-base">{titleInfo.emoji}</span>
            <span className="text-sm font-black" style={{ color: accentColor }}>{titleInfo.title}</span>
          </div>
          <p className="text-xs text-text-secondary">{titleInfo.desc}</p>
        </div>

        {/* 궁합 유형 (cd 있을 때) */}
        {cd && (
          <div className="mt-4 pt-4 border-t border-black/5 text-center">
            <p className="text-xs font-bold text-text-primary">{cd.compatibilityType}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{cd.compatibilityTypeDesc}</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          2. "이 한 마디로 요약하면" 인용구
         ══════════════════════════════════════════ */}
      <div className="rounded-3xl bg-[#1A1A1A] p-6 shadow-md">
        <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-3">AI 분석 한 줄 요약</p>
        <p className="text-base font-semibold text-white leading-relaxed">
          <span className="text-primary text-2xl font-black leading-none">"</span>
          {result.comment}
          <span className="text-primary text-2xl font-black leading-none">"</span>
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
          <span className="text-xs font-bold text-white/80">{result.commentType}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          3. 케미 지수 — 가로 스크롤 카드 3개
         ══════════════════════════════════════════ */}
      {cd?.chemistryScores && (
        <div>
          <div className="mb-3">
            <SectionTitle>케미 지수</SectionTitle>
            <p className="text-xs text-text-muted mt-0.5">두 사람의 유튜브 케미를 3가지로 분석했어요</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-0">
            <ChemistryCard type="conversation" score={cd.chemistryScores.conversationScore} />
            <ChemistryCard type="binge"        score={cd.chemistryScores.bingeDangerScore} />
            <ChemistryCard type="variety"      score={cd.chemistryScores.varietyScore} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          4. 취향 비교 — 가장 비슷 / 가장 달라 강조
         ══════════════════════════════════════════ */}
      {cd?.tasteComparison && (
        <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
          <SectionTitle>취향 비교</SectionTitle>
          <p className="text-xs text-text-muted mt-0.5 mb-4">카테고리별 취향 싱크로율이에요</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* 가장 비슷 */}
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-emerald-600 mb-1">💚 가장 비슷해요</p>
              <p className="text-sm font-bold text-text-primary leading-snug">{cd.tasteComparison.mostSimilarLabel}</p>
              <p className="text-2xl font-black text-emerald-500 mt-1 tabular-nums">{cd.tasteComparison.mostSimilarScore}%</p>
            </div>
            {/* 가장 달라 */}
            <div className="bg-red-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-red-500 mb-1">🔴 가장 달라요</p>
              <p className="text-sm font-bold text-text-primary leading-snug">{cd.tasteComparison.mostDifferentLabel}</p>
              <p className="text-2xl font-black text-red-500 mt-1 tabular-nums">{cd.tasteComparison.mostDifferentScore}%</p>
            </div>
          </div>

          {/* 나머지 카테고리 접기/펼치기 */}
          {sortedCategories.length > 0 && (
            <>
              <button
                onClick={() => setCategoryOpen(v => !v)}
                className="w-full flex items-center justify-between py-2 text-xs font-semibold text-primary"
              >
                <span>전체 카테고리 보기</span>
                <span>{categoryOpen ? "▲" : "▼"}</span>
              </button>
              {categoryOpen && (
                <div className="mt-3 space-y-3 animate-fade-in">
                  {sortedCategories.map(([key, score]) => {
                    const color = score >= 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#6B7280";
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-text-primary">{CATEGORY_LABELS[key] ?? key}</span>
                          <span className="text-xs font-bold tabular-nums" style={{ color }}>{score}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${score}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          5. 공통 구독 채널 — 숫자 강조 + 태그 형태
         ══════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
        {/* 헤더: 숫자 크게 */}
        <div className="flex items-end gap-3 mb-1">
          <span className="text-4xl font-black text-text-primary tabular-nums leading-none">
            {result.commonChannels.length}
          </span>
          <div className="pb-0.5">
            <p className="text-sm font-bold text-text-primary leading-tight">둘 다 구독하는 채널</p>
            <p className="text-xs text-text-muted">{getCommonChannelStory(result.commonChannels.length)}</p>
          </div>
        </div>

        {result.commonChannels.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">공통 구독 채널이 없어요</p>
        ) : (
          <>
            {/* 상위 10개 태그/pill */}
            <div className="flex flex-wrap gap-2 mt-4">
              {result.commonChannels.slice(0, 10).map((channel) => (
                <div
                  key={channel.id}
                  className="inline-flex items-center gap-1.5 bg-primary/8 border border-primary/20 rounded-full px-3 py-1.5"
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
                    style={{ backgroundColor: "#FF4D00" }}
                  >
                    {channel.title[0]}
                  </span>
                  <span className="text-xs font-semibold text-text-primary">{channel.title}</span>
                </div>
              ))}
            </div>
            {result.commonChannels.length > 10 && (
              <p className="text-xs text-text-muted mt-3 text-center">
                +{result.commonChannels.length - 10}개 더
              </p>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════
          6. 추천 채널 — "선물" 프레임
         ══════════════════════════════════════════ */}
      {cd?.crossRecsFromA && cd.crossRecsFromA.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🎁</span>
            <SectionTitle>{result.userAName}이 주는 선물</SectionTitle>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-7">
            {result.userBName}님이 아직 모르는 채널이에요
          </p>
          <div>
            {cd.crossRecsFromA.map((channel) => (
              <GiftChannelRow
                key={channel.id}
                title={channel.title}
                category={channel.customCategory}
                accentColor="#FF4D00"
                bgColor="#FFF1ED"
              />
            ))}
          </div>
        </div>
      )}

      {cd?.crossRecsFromB && cd.crossRecsFromB.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🎁</span>
            <SectionTitle>{result.userBName}이 주는 선물</SectionTitle>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-7">
            {result.userAName}님이 아직 모르는 채널이에요
          </p>
          <div>
            {cd.crossRecsFromB.map((channel) => (
              <GiftChannelRow
                key={channel.id}
                title={channel.title}
                category={channel.customCategory}
                accentColor="#3B82F6"
                bgColor="#EFF6FF"
              />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          7. 취향 DNA 레이더 차트
         ══════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
        <SectionTitle>취향 DNA 비교</SectionTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">
          <span className="text-primary font-bold">●</span> {result.userAName}
          <span className="ml-3 text-blue-500 font-bold">●</span> {result.userBName}
        </p>
        <RadarChartComponent
          vectorA={result.userAVector}
          vectorB={result.userBVector}
          nameA={result.userAName}
          nameB={result.userBName}
        />
      </div>

      {/* ══════════════════════════════════════════
          8. 뱃지 언락
         ══════════════════════════════════════════ */}
      {unlockedBadges.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
          <SectionTitle>🏅 획득한 뱃지</SectionTitle>
          <p className="text-xs text-text-muted mt-0.5 mb-3">이번 궁합에서 특별히 발견된 특징이에요</p>
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

      {/* ══════════════════════════════════════════
          9. 세부 점수 (접힌 형태)
         ══════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
        <SectionTitle>세부 항목 점수</SectionTitle>
        <p className="text-xs text-text-muted mt-0.5 mb-4">총점을 구성하는 5가지 항목이에요</p>
        <div className="space-y-4">
          {scoreDetails.map((detail, i) => {
            const pct   = Math.round((detail.score / detail.maxScore) * 100);
            const color = SCORE_COLOR_MAP[detail.key] ?? "#FF4D00";
            return (
              <div key={detail.key}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-text-primary">{detail.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black tabular-nums" style={{ color }}>{detail.score}</span>
                    <span className="text-xs text-text-muted">/ {detail.maxScore}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                      transitionDelay: `${i * 80}ms`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          10. 궁합 스토리 (enriched 또는 cd)
         ══════════════════════════════════════════ */}
      {cd?.compatibilityStory && (
        <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
          <SectionTitle>📖 우리의 유튜브 이야기</SectionTitle>
          <p className="text-sm text-text-secondary leading-relaxed italic mt-3">
            {cd.compatibilityStory}
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════
          11. 국가 다양성 비교 (enriched)
         ══════════════════════════════════════════ */}
      {enriched?.countryDiversity && (
        <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
          <SectionTitle>🌍 국가별 취향 비교</SectionTitle>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-primary/5 rounded-2xl p-4">
              <p className="text-xs font-bold text-primary mb-2 truncate">{result.userAName}</p>
              {(enriched.countryDiversity.userA as { flag: string; label: string; percent: number }[])
                ?.slice(0, 2)
                .map((item: { flag: string; label: string; percent: number }) => (
                  <p key={item.label} className="text-sm text-text-primary mt-1">
                    {item.flag} {item.label}{" "}
                    <span className="font-bold text-primary">{item.percent}%</span>
                  </p>
                ))}
            </div>
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-600 mb-2 truncate">{result.userBName}</p>
              {(enriched.countryDiversity.userB as { flag: string; label: string; percent: number }[])
                ?.slice(0, 2)
                .map((item: { flag: string; label: string; percent: number }) => (
                  <p key={item.label} className="text-sm text-text-primary mt-1">
                    {item.flag} {item.label}{" "}
                    <span className="font-bold text-blue-600">{item.percent}%</span>
                  </p>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          12. 진짜 취향 vs 최근 관심사 (enriched)
         ══════════════════════════════════════════ */}
      {enriched?.realTaste && (
        <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
          <SectionTitle>💎 진짜 취향 vs 최근 관심사</SectionTitle>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-primary truncate">{result.userAName}</p>
              {enriched.realTaste.userA?.longTerm && (
                <div className="bg-violet-50 rounded-xl p-3">
                  <p className="text-[10px] text-violet-500 font-bold mb-0.5">💎 진짜 취향</p>
                  <p className="text-sm font-bold text-text-primary">{enriched.realTaste.userA.longTerm}</p>
                </div>
              )}
              {enriched.realTaste.userA?.recent && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-[10px] text-amber-500 font-bold mb-0.5">✨ 최근 관심사</p>
                  <p className="text-sm font-bold text-text-primary">{enriched.realTaste.userA.recent}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-blue-600 truncate">{result.userBName}</p>
              {enriched.realTaste.userB?.longTerm && (
                <div className="bg-violet-50 rounded-xl p-3">
                  <p className="text-[10px] text-violet-500 font-bold mb-0.5">💎 진짜 취향</p>
                  <p className="text-sm font-bold text-text-primary">{enriched.realTaste.userB.longTerm}</p>
                </div>
              )}
              {enriched.realTaste.userB?.recent && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-[10px] text-amber-500 font-bold mb-0.5">✨ 최근 관심사</p>
                  <p className="text-sm font-bold text-text-primary">{enriched.realTaste.userB.recent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          13. 숨겨진 좋아요 공통점 (enriched)
         ══════════════════════════════════════════ */}
      {enriched?.likedComparison?.hiddenCommonCategories &&
        (enriched.likedComparison.hiddenCommonCategories as string[]).length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
            <SectionTitle>🤫 구독은 달라도, 좋아요는 통했어요!</SectionTitle>
            <div className="flex flex-wrap gap-2 mt-3">
              {(enriched.likedComparison.hiddenCommonCategories as string[]).map((cat: string) => (
                <span
                  key={cat}
                  className="inline-flex items-center bg-rose-50 text-rose-600 text-xs font-bold rounded-full px-3 py-1.5"
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </span>
              ))}
            </div>
          </div>
        )}

      {/* ══════════════════════════════════════════
          14. 좋아요 취향 비교 (enriched)
         ══════════════════════════════════════════ */}
      {enriched?.likedComparison && (
        <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>좋아요 취향 비교</SectionTitle>
            {enriched.likedComparison.syncScore != null && (
              <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-3 py-1">
                싱크 {enriched.likedComparison.syncScore}점
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold text-primary mb-2 truncate">{result.userAName}</p>
              <div className="space-y-1.5">
                {(enriched.likedComparison.userATopCategories as { category: string; label: string; percent: number }[] | undefined)
                  ?.slice(0, 4)
                  .map((item: { category: string; label: string; percent: number }) => (
                    <div key={item.category} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-text-primary truncate">{item.label || CATEGORY_LABELS[item.category] || item.category}</span>
                      <span className="text-xs font-bold text-primary shrink-0 tabular-nums">{item.percent}%</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 mb-2 truncate">{result.userBName}</p>
              <div className="space-y-1.5">
                {(enriched.likedComparison.userBTopCategories as { category: string; label: string; percent: number }[] | undefined)
                  ?.slice(0, 4)
                  .map((item: { category: string; label: string; percent: number }) => (
                    <div key={item.category} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-text-primary truncate">{item.label || CATEGORY_LABELS[item.category] || item.category}</span>
                      <span className="text-xs font-bold text-blue-600 shrink-0 tabular-nums">{item.percent}%</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          15. CTA — 공유 하나 크게, 나머지 아이콘
         ══════════════════════════════════════════ */}
      <div className="pt-2 pb-6 space-y-3">
        {/* 메인 CTA */}
        <button
          onClick={onShare}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold text-base rounded-2xl py-4 shadow-md active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          결과 공유하기
        </button>

        {/* 보조 액션 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-border text-text-primary font-semibold text-sm rounded-2xl py-3 active:scale-95 transition-transform"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            저장
          </button>
          <button
            onClick={() => router.push("/connect")}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-border text-text-primary font-semibold text-sm rounded-2xl py-3 active:scale-95 transition-transform"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-3.53"/>
            </svg>
            다시하기
          </button>
        </div>
      </div>

    </div>
  );
}
