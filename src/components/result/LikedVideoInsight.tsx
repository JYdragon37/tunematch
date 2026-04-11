"use client";
import type { LikedVideoInsight } from "@/types";

interface Props {
  data: LikedVideoInsight;
}

export function LikedVideoInsightCard({ data }: Props) {
  const matchColor =
    data.matchScore >= 70 ? "#10B981" : data.matchScore >= 40 ? "#F59E0B" : "#EF4444";
  const matchLabel =
    data.matchScore >= 70 ? "구독 취향이랑 잘 맞아요" : data.matchScore >= 40 ? "약간 다른 취향도 있어요" : "생각보다 다른 취향이 있어요";

  return (
    <div className="bg-white rounded-3xl p-6 border border-border">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">
        ❤️ 좋아요 영상 분석 · {data.totalLiked}개
      </p>

      <div className="flex items-center gap-4 mb-5">
        <div className="text-4xl">🎯</div>
        <div>
          <p className="text-sm text-gray-500">가장 많이 좋아요 누른 유형</p>
          <p className="font-bold text-gray-900 text-lg">{data.topCategoryLabel}</p>
        </div>
      </div>

      {/* 구독 취향과 일치도 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">구독 취향과 일치도</span>
          <span className="font-bold" style={{ color: matchColor }}>{data.matchScore}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${data.matchScore}%`, backgroundColor: matchColor }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{matchLabel}</p>
      </div>

      {/* 숨겨진 취향 */}
      {data.surpriseCategory && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-sm font-semibold text-yellow-800">숨겨진 취향 발견!</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              구독 채널에는 없지만{" "}
              <strong>{data.surpriseCategoryLabel}</strong> 영상에
              자주 좋아요를 누르고 있어요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
