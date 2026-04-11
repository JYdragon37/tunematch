"use client";
import type { ChannelStatsData } from "@/types";

interface Props {
  data: ChannelStatsData;
  totalChannels?: number;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function yearsAgoText(n?: number): string {
  if (!n || n < 1) return "최근";
  return `${n}년 전`;
}

export function ChannelRecordCard({ data, totalChannels }: Props) {
  const avg = (data as any).avgSubscriberCount as number | undefined;
  const avgFmt = avg
    ? avg >= 10_000 ? `${(avg / 10_000).toFixed(0)}만` : avg.toLocaleString()
    : null;
  const megaCount = (data as any).megaChannelCount as number | undefined;
  const megaPercent = (data as any).megaChannelPercent as number | undefined;

  return (
    <div className="bg-white rounded-3xl p-6 border border-border">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">
        🏆 나의 구독 기록관
        {totalChannels ? (
          <span className="ml-2 font-normal text-primary">{totalChannels}개 전수조사</span>
        ) : ""}
      </p>

      <div className="space-y-4">
        {/* 구독자 최다 */}
        <div className="flex items-center gap-3">
          <span className="text-2xl w-8 shrink-0">👑</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">구독자 최다 채널</p>
            <p className="font-semibold text-gray-900 text-sm truncate">{data.topSubscriber.title}</p>
          </div>
          <span className="text-sm font-bold text-primary shrink-0">{data.topSubscriber.formattedCount}명</span>
        </div>

        {/* 구독자 최소 */}
        <div className="flex items-center gap-3">
          <span className="text-2xl w-8 shrink-0">🤍</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">구독자 가장 적은 채널</p>
            <p className="font-semibold text-gray-900 text-sm truncate">{data.smallestSubscriber.title}</p>
          </div>
          <span className="text-sm font-bold text-gray-500 shrink-0">{data.smallestSubscriber.formattedCount}명</span>
        </div>

        {/* 가장 오래된 구독 */}
        <div className="flex items-center gap-3">
          <span className="text-2xl w-8 shrink-0">📅</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">
              가장 오래된 구독{data.oldestSub.yearsAgo ? ` · ${yearsAgoText(data.oldestSub.yearsAgo)}` : ""}
            </p>
            <p className="font-semibold text-gray-900 text-sm truncate">{data.oldestSub.title}</p>
          </div>
          <span className="text-xs text-gray-400 shrink-0">{formatDate(data.oldestSub.subscribedAt)}</span>
        </div>

        {/* 가장 최근 구독 */}
        <div className="flex items-center gap-3">
          <span className="text-2xl w-8 shrink-0">🆕</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">가장 최근 구독</p>
            <p className="font-semibold text-gray-900 text-sm truncate">{data.newestSub.title}</p>
          </div>
          <span className="text-xs text-gray-400 shrink-0">{formatDate(data.newestSub.subscribedAt)}</span>
        </div>

        {/* 평균 구독자 수 */}
        {avgFmt && (
          <div className="flex items-center gap-3">
            <span className="text-2xl w-8 shrink-0">📊</span>
            <div className="flex-1">
              <p className="text-xs text-gray-400">구독 채널 평균 구독자</p>
              <p className="font-semibold text-gray-900 text-sm">{avgFmt}명</p>
            </div>
          </div>
        )}

        {/* 소채널 팬 */}
        {data.hiddenFanCount > 0 && (
          <>
            <div className="h-px bg-border" />
            <div className="flex items-center gap-3 bg-purple-50 rounded-2xl p-3">
              <span className="text-2xl shrink-0">🕵️</span>
              <div>
                <p className="text-sm font-semibold text-purple-800">소채널 팬 인증!</p>
                <p className="text-xs text-purple-600">
                  구독자 10만 이하 채널 <strong>{data.hiddenFanCount}개</strong> 구독 중 ({data.hiddenFanPercent}%)
                </p>
              </div>
            </div>
          </>
        )}

        {/* 메가채널 */}
        {megaCount != null && megaCount > 0 && (
          <div className="flex items-center gap-3 bg-orange-50 rounded-2xl p-3">
            <span className="text-2xl shrink-0">🔥</span>
            <div>
              <p className="text-sm font-semibold text-orange-800">메가채널 팬!</p>
              <p className="text-xs text-orange-600">
                구독자 100만+ 채널 <strong>{megaCount}개</strong> ({megaPercent}%)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
