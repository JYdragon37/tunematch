"use client";
import { useRouter } from "next/navigation";
import { TasteTypeBadge } from "./TasteTypeBadge";
import { DiversityGauge } from "./DiversityGauge";
import { FriendTypeCard } from "./FriendTypeCard";
import { RadarChartComponent } from "@/components/charts/RadarChart";
import { ScoreBar } from "@/components/ui/ScoreBar";
import type { MatchResult } from "@/types";

interface Props {
  result: MatchResult;
}

const TOP_CATEGORY_COLORS = ["#FF4D00", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];

export function SoloResultView({ result }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="text-center animate-fade-in">
        <p className="text-lg font-semibold text-gray-900">
          {result.userAName}의 유튜브 취향 분석
        </p>
      </div>

      {/* ① 취향 유형 뱃지 */}
      {result.tasteType && (
        <div className="animate-fade-in">
          <TasteTypeBadge
            tasteType={result.tasteType}
            userName={result.userAName}
          />
        </div>
      )}

      {/* ② 카테고리 DNA 레이더 */}
      <div className="bg-white rounded-3xl p-6 border border-border animate-fade-in-delay-1">
        <h3 className="font-bold text-gray-900 mb-1">취향 DNA</h3>
        <p className="text-xs text-gray-400 mb-4">8개 카테고리 분포</p>
        <RadarChartComponent
          vectorA={result.userAVector}
          vectorB={result.userAVector}
          nameA={result.userAName}
          nameB=""
        />
      </div>

      {/* ③ 취향 집중도 */}
      {result.diversityIndex !== undefined && (
        <div className="animate-fade-in-delay-2">
          <DiversityGauge diversityIndex={result.diversityIndex} />
        </div>
      )}

      {/* ④ TOP 취향 카테고리 */}
      {result.topCategories && result.topCategories.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-border animate-fade-in-delay-2">
          <h3 className="font-bold text-gray-900 mb-4">TOP 취향 카테고리</h3>
          {result.topCategories.map((cat, i) => (
            <div key={cat.key} className="flex items-center gap-3 mb-3">
              <span className="w-5 text-center text-sm font-bold text-gray-400">{i + 1}</span>
              <span className="text-lg">{cat.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{cat.label}</span>
                  <span className="font-bold" style={{ color: TOP_CATEGORY_COLORS[i] }}>
                    {cat.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: TOP_CATEGORY_COLORS[i],
                      transition: "width 0.8s ease-out",
                      transitionDelay: `${i * 100}ms`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ⑤ 나와 잘 맞을 친구 취향 */}
      {result.friendType && (
        <div className="animate-fade-in-delay-3">
          <FriendTypeCard
            friendType={result.friendType}
            friendTypeReason={result.friendTypeReason || ""}
            onStartMatch={() => router.push("/connect")}
          />
        </div>
      )}

      {/* ⑥ 추천 채널 */}
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
