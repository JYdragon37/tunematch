/**
 * 솔로 취향 분석 인사이트 계산 (클라이언트 사이드)
 */
import type { TasteType, TopCategory } from "@/types";

// ─── 유튜브 중독도 ───
export interface AddictionResult {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export function calcAddictionLevel(channelCount: number): AddictionResult {
  if (channelCount <= 30) return {
    level: 1, emoji: "😌", label: "가벼운 감상파",
    description: "유튜브를 가볍게 즐기는 건강한 시청자예요.",
    color: "#10B981",
  };
  if (channelCount <= 80) return {
    level: 2, emoji: "👀", label: "취미 시청자형",
    description: "여가시간을 유튜브로 알차게 보내는 타입이에요.",
    color: "#3B82F6",
  };
  if (channelCount <= 150) return {
    level: 3, emoji: "📺", label: "헤비 유저형",
    description: "유튜브가 제2의 TV. 알고리즘이 당신을 잘 알아요.",
    color: "#F59E0B",
  };
  if (channelCount <= 300) return {
    level: 4, emoji: "🔥", label: "유튜브 의존형",
    description: "자기 전, 밥 먹을 때, 심심할 때 — 항상 유튜브죠?",
    color: "#EF4444",
  };
  return {
    level: 5, emoji: "💀", label: "유튜브 없인 못 살아",
    description: "구독 채널만으로 OTT 플랫폼을 대체할 수 있는 수준이에요.",
    color: "#7C3AED",
  };
}

// ─── 취향 희귀도 ───
export interface RarityResult {
  percentile: string;  // "상위 15%"
  label: string;
  emoji: string;
  description: string;
}

export function calcTasteRarity(tasteType: TasteType, diversityIndex: number): RarityResult {
  // 희귀 카테고리: news, tech, knowledge (보통 사람들이 덜 봄)
  const rareTypes: TasteType[] = ["news", "tech", "knowledge", "collector"];
  const isRare = rareTypes.includes(tasteType);
  const isHighDiversity = diversityIndex >= 70;

  if (isRare && isHighDiversity) return {
    percentile: "상위 8%",
    emoji: "💎",
    label: "희귀 취향",
    description: "대부분의 사람과 다른 독특한 채널 구성을 갖고 있어요.",
  };
  if (isRare || isHighDiversity) return {
    percentile: "상위 22%",
    emoji: "✨",
    label: "개성 있는 취향",
    description: "평균보다 다양하거나 독특한 취향을 갖고 있어요.",
  };
  if (diversityIndex >= 50) return {
    percentile: "상위 45%",
    emoji: "🌟",
    label: "균형 잡힌 취향",
    description: "여러 장르를 골고루 즐기는 보편적인 취향이에요.",
  };
  return {
    percentile: "상위 60%",
    emoji: "📌",
    label: "집중형 취향",
    description: "좋아하는 장르가 명확한 뚜렷한 취향이에요.",
  };
}

// ─── 예상 시청시간 ───
export interface WatchTimeResult {
  weeklyHours: number;
  weeklyMinutes: number;
  yearlyDays: number;
  message: string;
}

export function estimateWatchTime(channelCount: number): WatchTimeResult {
  // 채널당 평균 주 1.5회, 영상 12분 기준
  const weeklyMinutes = Math.round(channelCount * 1.5 * 12);
  const weeklyHours = Math.round(weeklyMinutes / 60 * 10) / 10;
  const yearlyDays = Math.round((weeklyMinutes * 52) / (60 * 24) * 10) / 10;

  let message = "";
  if (weeklyHours < 5) message = "유튜브를 꽤 절제하며 보는 편이에요";
  else if (weeklyHours < 15) message = "하루 평균 영화 한 편 분량의 유튜브를 봐요";
  else if (weeklyHours < 30) message = "유튜브가 주요 콘텐츠 플랫폼이에요";
  else message = "유튜브가 거의 풀타임 취미 수준이에요 🤯";

  return { weeklyHours, weeklyMinutes, yearlyDays, message };
}

// ─── 나를 설명하는 한 줄 ───
export function generateOneLiner(tasteType: TasteType, topCategories: TopCategory[]): string {
  const top = topCategories[0]?.label || "";
  const second = topCategories[1]?.label || "";

  const templates: Record<TasteType, string[]> = {
    tech: [
      `나는 유튜브로 기술 트렌드를 파악하는 ${top} 마니아`,
      `알고리즘보다 내가 먼저 아는 테크 얼리어답터`,
      `${top}와 ${second}으로 미래를 공부하는 사람`,
    ],
    knowledge: [
      `나는 유튜브가 두 번째 도서관인 ${top} 탐험가`,
      `궁금한 게 생기면 유튜브부터 검색하는 지식 덕후`,
      `${top}와 ${second}으로 세상을 이해하는 사람`,
    ],
    entertainment: [
      `나는 유튜브로 일상을 즐기는 ${top} 마니아`,
      `알고리즘이 나를 제일 잘 아는 콘텐츠 러버`,
      `${top} 없이는 심심한 엔터테인먼트 중독자`,
    ],
    humor: [
      `나는 유튜브로 웃음을 충전하는 유머 감성파`,
      `피드가 항상 유쾌한 웃음 탐정`,
      `${top}으로 스트레스를 날리는 사람`,
    ],
    music: [
      `나는 유튜브로 음악을 감상하는 뮤직 감성파`,
      `플레이리스트가 곧 일기인 음악 탐험가`,
      `${top}과 ${second}으로 하루를 채우는 사람`,
    ],
    lifestyle: [
      `나는 유튜브로 라이프스타일을 업그레이드하는 사람`,
      `${top}와 ${second}에서 영감을 얻는 라이프 큐레이터`,
      `먹고 사는 것에 진지하게 진심인 사람`,
    ],
    news: [
      `나는 유튜브로 세상 돌아가는 걸 파악하는 시사 분석가`,
      `뉴스보다 유튜브로 더 깊이 이해하는 정보 수집가`,
      `${top}와 ${second}으로 세상을 분석하는 사람`,
    ],
    collector: [
      `나는 유튜브로 모든 것을 취향으로 만드는 콜렉터`,
      `장르 불문, 재미있으면 다 보는 취향 탐험가`,
      `${top}부터 ${second}까지, 콘텐츠 잡식성 인간`,
    ],
  };

  const options = templates[tasteType] || templates.collector;
  return options[Math.floor(Math.random() * options.length)];
}
