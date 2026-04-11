"use client";
import type { ChannelStatsData, CuratedChannel } from "@/types";

interface Props {
  data: ChannelStatsData;
  curatedRecs?: CuratedChannel[];
}

const COUNTRY_COLORS: Record<string, string> = {
  KR: "#FF4D00", US: "#3B82F6", JP: "#EF4444",
  GB: "#8B5CF6", IN: "#F59E0B", AU: "#10B981", CA: "#EC4899",
};

export function CountryDistribution({ data, curatedRecs }: Props) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-border">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">🌍 구독 채널 국가 분포</p>

      <div className="space-y-3 mb-6">
        {data.countryDist.map((c) => (
          <div key={c.code}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{c.label}</span>
              <span className="font-bold" style={{ color: COUNTRY_COLORS[c.code] || "#6B7280" }}>
                {c.percent}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${c.percent}%`, backgroundColor: COUNTRY_COLORS[c.code] || "#6B7280" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 큐레이션 추천 */}
      {curatedRecs && curatedRecs.length > 0 && (
        <>
          <div className="h-px bg-border mb-4" />
          <p className="text-xs font-semibold text-gray-700 mb-3">📺 아직 구독 안 한 추천 채널</p>
          <div className="space-y-2">
            {curatedRecs.map((ch) => (
              <div key={ch.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                  {ch.title[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{ch.title}</p>
                  <p className="text-xs text-gray-400">{ch.description}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{ch.country}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
