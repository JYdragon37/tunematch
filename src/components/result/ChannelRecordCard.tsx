"use client";
import type { ChannelStatsData } from "@/types";

interface Props {
  data: ChannelStatsData;
}

export function ChannelRecordCard({ data }: Props) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-border">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">🏆 나의 구독 기록관</p>

      <div className="space-y-4">
        {/* 구독자 최다 */}
        <div className="flex items-center gap-3">
          <span className="text-2xl w-8">👑</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">구독자 최다 채널</p>
            <p className="font-semibold text-gray-900 text-sm truncate">{data.topSubscriber.title}</p>
          </div>
          <span className="text-sm font-bold text-primary shrink-0">{data.topSubscriber.formattedCount}명</span>
        </div>

        {/* 구독자 최소 */}
        <div className="flex items-center gap-3">
          <span className="text-2xl w-8">🤍</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">숨겨진 소채널</p>
            <p className="font-semibold text-gray-900 text-sm truncate">{data.smallestSubscriber.title}</p>
          </div>
          <span className="text-sm font-bold text-gray-500 shrink-0">{data.smallestSubscriber.formattedCount}명</span>
        </div>

        {/* 가장 오래된 구독 */}
        <div className="flex items-center gap-3">
          <span className="text-2xl w-8">📅</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">
              가장 오래된 구독
              {data.oldestSub.yearsAgo ? ` · ${data.oldestSub.yearsAgo}년 전` : ""}
            </p>
            <p className="font-semibold text-gray-900 text-sm truncate">{data.oldestSub.title}</p>
          </div>
          <span className="text-xs text-gray-400 shrink-0">
            {data.oldestSub.subscribedAt
              ? new Date(data.oldestSub.subscribedAt).getFullYear() + "년"
              : ""}
          </span>
        </div>

        {/* 가장 최근 구독 */}
        <div className="flex items-center gap-3">
          <span className="text-2xl w-8">🆕</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">가장 최근 구독</p>
            <p className="font-semibold text-gray-900 text-sm truncate">{data.newestSub.title}</p>
          </div>
        </div>

        {/* 소채널 팬 */}
        {data.hiddenFanCount > 0 && (
          <>
            <div className="h-px bg-border" />
            <div className="flex items-center gap-3 bg-purple-50 rounded-2xl p-3">
              <span className="text-2xl">🕵️</span>
              <div>
                <p className="text-sm font-semibold text-purple-800">소채널 팬 인증!</p>
                <p className="text-xs text-purple-600">
                  구독자 10만 이하 채널 {data.hiddenFanCount}개 구독 중 ({data.hiddenFanPercent}%)
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
