"use client";
import type { ChannelStatsData, CuratedChannel } from "@/types";

interface Props {
  data: ChannelStatsData;
  curatedRecs?: CuratedChannel[];
  trendingRecs?: CuratedChannel[];
}

const COUNTRY_COLORS: Record<string, string> = {
  KR: "#FF4D00", US: "#3B82F6", JP: "#EF4444",
  GB: "#8B5CF6", IN: "#F59E0B", AU: "#10B981", CA: "#EC4899",
};

const CATEGORY_LABELS: Record<string, string> = {
  entertainment: "엔터/게임", knowledge: "지식/교육", humor: "유머/밈",
  lifestyle: "라이프스타일", music: "음악", news: "뉴스/시사", food: "음식/요리", tech: "테크",
};

const CATEGORY_EMOJI: Record<string, string> = {
  entertainment: "🎮", knowledge: "📚", humor: "😂", lifestyle: "🍳",
  music: "🎵", news: "📰", food: "🍜", tech: "💻",
};

function RecommendCard({ ch }: { ch: CuratedChannel }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-sm shrink-0">
        {ch.title[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{ch.title}</p>
        <p className="text-xs text-gray-400 truncate">{ch.description}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-gray-600">{ch.subscriberCount || ""}</p>
        <p className="text-xs text-gray-400">{CATEGORY_EMOJI[ch.category] || "📺"} {CATEGORY_LABELS[ch.category] || ch.category}</p>
      </div>
    </div>
  );
}

export function CountryDistribution({ data, curatedRecs, trendingRecs }: Props) {
  return (
    <div className="space-y-4">
      {/* 국가 분포 */}
      <div className="bg-white rounded-3xl p-6 border border-border">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">🌍 구독 채널 국가 분포</p>
        <div className="space-y-3">
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
      </div>

      {/* 구독 안 한 추천 채널 */}
      {curatedRecs && curatedRecs.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">📺 아직 구독 안 한 추천 채널</p>
          <p className="text-xs text-gray-400 mb-3">내 취향 + 거주 국가 기반 추천</p>
          <div className="space-y-2">
            {curatedRecs.map((ch) => <RecommendCard key={ch.id} ch={ch} />)}
          </div>
        </div>
      )}

      {/* 요즘 뜨는 채널 */}
      {trendingRecs && trendingRecs.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-border">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">🔥 요즘 뜨는 채널</p>
          <p className="text-xs text-gray-400 mb-3">내 취향과 맞는 급성장 채널</p>
          <div className="space-y-2">
            {trendingRecs.map((ch) => (
              <div key={ch.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-200 to-orange-100 flex items-center justify-center font-bold text-orange-600 text-sm shrink-0">
                  {ch.title[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{ch.title}</p>
                    <span className="text-xs text-orange-500 font-bold shrink-0">↑</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{ch.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-gray-600">{ch.subscriberCount || ""}</p>
                  <p className="text-xs text-gray-400">{CATEGORY_EMOJI[ch.category] || "📺"} {CATEGORY_LABELS[ch.category] || ch.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
