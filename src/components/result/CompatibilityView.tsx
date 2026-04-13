"use client";
import type { MatchResult } from "@/types";
import { getScoreDetails } from "@/lib/algorithm";
import { CountUpScore } from "@/components/ui/CountUpScore";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { RadarChartComponent } from "@/components/charts/RadarChart";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface Props {
  result: MatchResult;
  matchId: string;
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

export function CompatibilityView({ result, matchId: _matchId, onShare, onSave }: Props) {
  const router = useRouter();
  const cd = result.comparisonData;
  const scoreDetails = getScoreDetails(result);

  const userATasteType = cd?.userATasteType;
  const userBTasteType = cd?.userBTasteType;
  const tasteA = userATasteType ? TASTE_TYPE_MAP[userATasteType] : null;
  const tasteB = userBTasteType ? TASTE_TYPE_MAP[userBTasteType] : null;

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

      {/* 섹션 3: 케미 지수 */}
      {cd?.chemistryScores && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-5">케미 지수</h2>
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

      {/* 섹션 9: 공통 구독 채널 TOP 10 */}
      {result.commonChannels.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-4">
            공통 구독 채널 TOP {Math.min(result.commonChannels.length, 10)}
          </h2>
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
