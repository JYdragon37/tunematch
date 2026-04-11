"use client";
import type { ChannelStatsData, ChannelStatItem } from "@/types";

interface Props {
  data: ChannelStatsData;
  totalChannels?: number;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function fmtSub(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return `${n}`;
}

function ChannelRow({ rank, item, showDate }: { rank?: number; item: ChannelStatItem; showDate?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {rank !== undefined && (
        <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{rank}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
        {showDate && item.subscribedAt && (
          <p className="text-xs text-gray-400">{formatDate(item.subscribedAt)}</p>
        )}
      </div>
      <span className="text-xs font-bold text-gray-600 shrink-0">{fmtSub(item.subscriberCount)}명</span>
    </div>
  );
}

function Section({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <p className="text-xs font-bold text-gray-500 mb-3">{emoji} {title}</p>
      {children}
    </div>
  );
}

export function ChannelRecordCard({ data, totalChannels }: Props) {
  const d = data as any;
  const yearDist: {year: number; count: number}[] = d.yearDist || [];
  const maxYearCount = Math.max(...yearDist.map((y: any) => y.count), 1);
  const bands = d.subscriberBands || {};
  const totalBands = (bands.nano||0)+(bands.small||0)+(bands.mid||0)+(bands.mega||0) || 1;
  const countryReps: any[] = d.countryRepresentatives || [];

  return (
    <div className="bg-white rounded-3xl p-6 border border-border space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">🏆 나의 구독 기록관</p>
        {totalChannels && (
          <span className="text-xs font-semibold text-primary">{totalChannels}개 전수조사</span>
        )}
      </div>

      {/* ① 구독자 TOP 5 */}
      {d.top5Subscribers?.length > 0 && (
        <Section emoji="👑" title="구독자 많은 채널 TOP 5">
          <div className="divide-y divide-gray-100">
            {d.top5Subscribers.map((item: ChannelStatItem, i: number) => (
              <ChannelRow key={item.title} rank={i + 1} item={item} />
            ))}
          </div>
        </Section>
      )}

      {/* ② 소채널 TOP 5 */}
      {d.top5Hidden?.length > 0 && (
        <Section emoji="🤍" title="내가 응원하는 소채널 TOP 5">
          <div className="divide-y divide-gray-100">
            {d.top5Hidden.map((item: ChannelStatItem, i: number) => (
              <ChannelRow key={item.title} rank={i + 1} item={item} />
            ))}
          </div>
        </Section>
      )}

      {/* ③ 메가채널 TOP 5 */}
      {d.top5Mega?.length > 0 && (
        <Section emoji="🔥" title="메가채널 TOP 5 (구독자 100만+)">
          <div className="divide-y divide-gray-100">
            {d.top5Mega.map((item: ChannelStatItem, i: number) => (
              <ChannelRow key={item.title} rank={i + 1} item={item} />
            ))}
          </div>
        </Section>
      )}

      {/* ④ 연도별 구독 히스토리 */}
      {yearDist.length > 0 && (
        <Section emoji="📆" title="연도별 구독 히스토리">
          <div className="space-y-2">
            {yearDist.map(({ year, count }) => (
              <div key={year} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-10 shrink-0">{year}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(count / maxYearCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-8 text-right">{count}개</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ⑤⑥ 구독 속도 + 규모 분포 나란히 */}
      <div className="grid grid-cols-2 gap-3">
        {d.subSpeedDays > 0 && (
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-400 mb-1">⚡ 구독 속도</p>
            <p className="text-2xl font-black text-blue-700">{d.subSpeedDays}일</p>
            <p className="text-xs text-blue-500 mt-1">마다 채널 1개</p>
          </div>
        )}
        {bands.mega !== undefined && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 mb-2">📊 구독자 규모</p>
            {[
              { label: "100만+", val: bands.mega, color: "#FF4D00" },
              { label: "10~100만", val: bands.mid, color: "#F59E0B" },
              { label: "1~10만", val: bands.small, color: "#10B981" },
              { label: "~1만", val: bands.nano, color: "#6B7280" },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center gap-1 mb-1">
                <span className="text-xs text-gray-500 w-14">{label}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(val / totalBands) * 100}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-600 w-4 text-right">{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ⑦ 국가별 대표 채널 */}
      {countryReps.length > 0 && (
        <Section emoji="🌍" title="국가별 대표 채널">
          <div className="space-y-2">
            {countryReps.map((rep: any) => (
              <div key={rep.code} className="flex items-center gap-3">
                <span className="text-sm">{rep.label}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{rep.topChannel.title}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{rep.count}개</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ⑨ 최근 1년 활동 */}
      {d.recentSubCount !== undefined && (
        <div className={`rounded-2xl p-4 ${d.recentSubCount > 10 ? "bg-green-50" : "bg-gray-50"}`}>
          <p className="text-xs font-bold text-gray-400 mb-1">⏰ 최근 1년 구독 활동</p>
          <p className="text-2xl font-black text-gray-800">{d.recentSubCount}개</p>
          <p className="text-xs text-gray-500 mt-1">
            {d.recentSubCount > 20 ? "최근에도 활발하게 구독 중이에요" :
             d.recentSubCount > 5 ? "꾸준히 새 채널을 발굴하고 있어요" :
             "최근엔 새 채널 구독이 뜸한 편이에요"}
          </p>
        </div>
      )}

      {/* ⑩ 오랜 인연 TOP 5 */}
      {d.top5Oldest?.length > 0 && (
        <Section emoji="🏅" title="오랜 인연 TOP 5 (가장 오래된 구독)">
          <div className="divide-y divide-gray-100">
            {d.top5Oldest.map((item: ChannelStatItem, i: number) => (
              <ChannelRow key={item.title} rank={i + 1} item={item} showDate />
            ))}
          </div>
        </Section>
      )}

      {/* 📺 영상 많이 올린 채널 TOP 5 */}
      {d.top5ByVideoCount?.length > 0 && (
        <Section emoji="📺" title="영상 가장 많이 올린 채널 TOP 5">
          <div className="divide-y divide-gray-100">
            {d.top5ByVideoCount.map((item: any, i: number) => (
              <div key={item.title} className="flex items-center gap-3 py-2">
                <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                </div>
                <span className="text-xs font-bold text-gray-600 shrink-0">
                  {item.videoCount?.toLocaleString()}개
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 🏃 가장 오래된 채널 TOP 5 (채널 개설일) */}
      {d.top5OldestChannels?.length > 0 && (
        <Section emoji="🏺" title="가장 오래된 유튜브 채널 TOP 5">
          <div className="divide-y divide-gray-100">
            {d.top5OldestChannels.map((item: any, i: number) => (
              <div key={item.title} className="flex items-center gap-3 py-2">
                <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  {item.channelCreatedAt && (
                    <p className="text-xs text-gray-400">
                      {new Date(item.channelCreatedAt).getFullYear()}년 개설
                      {item.channelAgeYears ? ` · ${item.channelAgeYears}년 된 채널` : ""}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-500 shrink-0">{fmtSub(item.subscriberCount)}명</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 🌙 평균 채널 나이 */}
      {d.avgChannelAgeYears > 0 && (
        <div className="bg-indigo-50 rounded-2xl p-4">
          <p className="text-xs font-bold text-indigo-400 mb-1">🌙 내가 구독하는 채널 평균 나이</p>
          <p className="text-2xl font-black text-indigo-700">{d.avgChannelAgeYears}년</p>
          <p className="text-xs text-indigo-500 mt-1">
            {d.avgChannelAgeYears >= 8 ? "유튜브 황금기부터 함께한 올드비 취향이에요" :
             d.avgChannelAgeYears >= 5 ? "검증된 채널들을 주로 구독하는 타입이에요" :
             "최신 채널을 빠르게 발굴하는 트렌디한 취향이에요"}
          </p>
        </div>
      )}

      {/* 🔮 나의 안목 채널 (일찍 구독 + 지금 큰 채널) */}
      {d.earlyBirdChannels?.length > 0 && (
        <Section emoji="🔮" title="나의 안목 채널 (일찍 구독한 대형 채널)">
          <p className="text-xs text-gray-400 mb-2">2년 이상 전 구독 + 현재 100만 이상 채널</p>
          <div className="divide-y divide-gray-100">
            {d.earlyBirdChannels.map((item: ChannelStatItem, i: number) => (
              <ChannelRow key={item.title} rank={i + 1} item={item} showDate />
            ))}
          </div>
        </Section>
      )}

      {/* 🔤 채널명 자주 나오는 키워드 */}
      {d.topKeywords?.length > 0 && (
        <Section emoji="🔤" title="구독 채널에 자주 나오는 키워드">
          <div className="flex flex-wrap gap-2">
            {d.topKeywords.map((k: { word: string; count: number }, i: number) => (
              <span
                key={k.word}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: i === 0 ? "#FF4D0015" : i < 3 ? "#F59E0B15" : "#F3F4F6",
                  color: i === 0 ? "#FF4D00" : i < 3 ? "#D97706" : "#6B7280",
                  fontSize: `${Math.max(10, 13 - i)}px`,
                }}
              >
                {k.word} <span className="opacity-60">{k.count}</span>
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
