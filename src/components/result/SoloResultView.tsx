"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TasteTypeBadge } from "./TasteTypeBadge";
import { DiversityGauge } from "./DiversityGauge";
import { FriendTypeCard } from "./FriendTypeCard";
import { RadarChartComponent } from "@/components/charts/RadarChart";
import type { MatchResult } from "@/types";
import {
  calcAddictionLevel,
  calcTasteRarity,
  estimateWatchTime,
  generateOneLiner,
} from "@/lib/insights";

interface Props {
  result: MatchResult;
}

const TOP_CATEGORY_COLORS = ["#FF4D00", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];

const MOCK_CHANNEL_IDS = new Set(["UCupvZG-5ko_eiXAupbDfxWw", "UC-9-kyTW8ZkZNDHQJ6FgpwQ", "UCbmNph6atAoGfqLoCL_duAg"]);
function isMockResult(result: MatchResult): boolean {
  return result.commonChannels.some((c) => MOCK_CHANNEL_IDS.has(c.id));
}

export function SoloResultView({ result }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const usingMock = isMockResult(result);

  const channelCount = result.channelCount ?? result.commonChannels.length;
  const addiction = calcAddictionLevel(channelCount);
  const rarity = result.tasteType ? calcTasteRarity(result.tasteType, result.diversityIndex ?? 50) : null;
  const watchTime = estimateWatchTime(channelCount);
  const oneLiner = result.tasteType
    ? generateOneLiner(result.tasteType, result.topCategories ?? [])
    : "";

  const handleCopyOneLiner = async () => {
    await navigator.clipboard.writeText(oneLiner).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* mock 경고 */}
      {usingMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">샘플 데이터로 분석됐어요</p>
            <p className="text-xs text-amber-700 mt-0.5">YouTube 재연동 후 실제 채널로 분석됩니다.</p>
            <button onClick={() => router.push("/connect")} className="mt-2 text-xs font-semibold text-amber-800 underline">
              다시 연동하기 →
            </button>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="text-center animate-fade-in">
        <p className="text-lg font-semibold text-gray-900">{result.userAName}의 유튜브 취향 분석</p>
        <p className="text-xs text-gray-400 mt-1">구독 채널 {channelCount}개 분석 완료</p>
      </div>

      {/* ① 취향 유형 뱃지 */}
      {result.tasteType && (
        <div className="animate-fade-in">
          <TasteTypeBadge tasteType={result.tasteType} userName={result.userAName} />
        </div>
      )}

      {/* ② 나를 설명하는 한 줄 */}
      {oneLiner && (
        <div className="bg-white rounded-3xl p-6 border border-border animate-fade-in-delay-1">
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-3">🎯 나를 설명하는 한 줄</p>
          <p className="text-base font-semibold text-gray-900 leading-relaxed mb-4">"{oneLiner}"</p>
          <button
            onClick={handleCopyOneLiner}
            className="w-full py-2.5 rounded-xl border border-primary/30 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
          >
            {copied ? "✓ 복사됨!" : "📋 복사하기"}
          </button>
        </div>
      )}

      {/* ③ 유튜브 중독도 */}
      <div className="bg-white rounded-3xl p-6 border border-border animate-fade-in-delay-1">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">🔥 유튜브 중독도</p>
        <div className="flex items-center gap-4 mb-3">
          <span className="text-4xl">{addiction.emoji}</span>
          <div>
            <p className="font-bold text-gray-900 text-lg">{addiction.label}</p>
            <p className="text-sm text-gray-500 mt-0.5">{addiction.description}</p>
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-2 flex-1 rounded-full"
              style={{
                backgroundColor: i <= addiction.level ? addiction.color : "#F3F4F6",
              }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">구독 채널 {channelCount}개 기준</p>
      </div>

      {/* ④ 희귀도 + 시청시간 나란히 */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-delay-2">
        {rarity && (
          <div className="bg-white rounded-3xl p-5 border border-border">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">💎 취향 희귀도</p>
            <p className="text-2xl mb-1">{rarity.emoji}</p>
            <p className="text-xs font-bold text-primary">{rarity.percentile}</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{rarity.label}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rarity.description}</p>
          </div>
        )}
        <div className="bg-white rounded-3xl p-5 border border-border">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">⏱️ 예상 시청시간</p>
          <p className="text-2xl mb-1">📺</p>
          <p className="text-xs font-bold text-primary">주 {watchTime.weeklyHours}시간</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">연 {watchTime.yearlyDays}일</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{watchTime.message}</p>
        </div>
      </div>

      {/* ⑤ 카테고리 DNA */}
      <div className="bg-white rounded-3xl p-6 border border-border animate-fade-in-delay-2">
        <h3 className="font-bold text-gray-900 mb-1">취향 DNA</h3>
        <p className="text-xs text-gray-400 mb-4">8개 카테고리 분포</p>
        <RadarChartComponent
          vectorA={result.userAVector}
          vectorB={result.userAVector}
          nameA={result.userAName}
          nameB=""
        />
      </div>

      {/* ⑥ 취향 집중도 */}
      {result.diversityIndex !== undefined && (
        <div className="animate-fade-in-delay-2">
          <DiversityGauge diversityIndex={result.diversityIndex} />
        </div>
      )}

      {/* ⑦ TOP 취향 카테고리 */}
      {result.topCategories && result.topCategories.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-border animate-fade-in-delay-3">
          <h3 className="font-bold text-gray-900 mb-4">TOP 취향 카테고리</h3>
          {result.topCategories.map((cat, i) => (
            <div key={cat.key} className="flex items-center gap-3 mb-3">
              <span className="w-5 text-center text-sm font-bold text-gray-400">{i + 1}</span>
              <span className="text-lg">{cat.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{cat.label}</span>
                  <span className="font-bold" style={{ color: TOP_CATEGORY_COLORS[i] }}>{cat.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.percentage}%`, backgroundColor: TOP_CATEGORY_COLORS[i], transitionDelay: `${i * 100}ms` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ⑧ 나와 잘 맞을 친구 취향 */}
      {result.friendType && (
        <div className="animate-fade-in-delay-3">
          <FriendTypeCard
            friendType={result.friendType}
            friendTypeReason={result.friendTypeReason ?? ""}
            onStartMatch={() => router.push("/connect")}
          />
        </div>
      )}

      {/* ⑨ 추천 채널 */}
      {result.recommendations.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-border animate-fade-in-delay-3">
          <h3 className="font-bold text-gray-900 mb-4">📺 추천 채널</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {result.recommendations.map((ch) => (
              <div key={ch.id} className="shrink-0 w-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-2 text-lg font-bold text-primary">
                  {ch.title[0]}
                </div>
                <p className="text-xs font-medium text-gray-800 leading-tight line-clamp-2">{ch.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
