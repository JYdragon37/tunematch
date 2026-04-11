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

// mock 채널 ID 목록 (15개 mock 데이터 샘플)
const MOCK_CHANNEL_IDS = new Set(["UCupvZG-5ko_eiXAupbDfxWw", "UC-9-kyTW8ZkZNDHQJ6FgpwQ", "UCbmNph6atAoGfqLoCL_duAg"]);
function isMockResult(result: MatchResult): boolean {
  return result.commonChannels.some((c) => MOCK_CHANNEL_IDS.has(c.id));
}

export function SoloResultView({ result }: Props) {
  const router = useRouter();
  const usingMock = isMockResult(result);

  return (
    <div className="space-y-5">
      {/* mock 경고 배너 */}
      {usingMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">샘플 데이터로 분석됐어요</p>
            <p className="text-xs text-amber-700 mt-0.5">
              YouTube 연동이 완전하지 않아 샘플 채널로 분석됐습니다.
              다시 로그인하면 내 실제 구독 채널로 분석해드려요.
            </p>
            <button
              onClick={() => router.push("/connect")}
              className="mt-2 text-xs font-semibold text-amber-800 underline"
            >
              다시 연동하기 →
            </button>
          </div>
        </div>
      )}

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
