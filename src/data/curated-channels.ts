import type { CuratedChannel } from "@/types";

export const CURATED_CHANNELS: CuratedChannel[] = [
  // ── 한국 (KR) ──
  { id: "kr-tech-1", title: "노마드 코더", country: "KR", category: "tech", description: "한국 최고의 코딩 교육 채널" },
  { id: "kr-tech-2", title: "조코딩 JoCoding", country: "KR", category: "tech", description: "실무 개발자의 코딩 이야기" },
  { id: "kr-tech-3", title: "드림코딩", country: "KR", category: "tech", description: "모던 웹 개발 강의" },
  { id: "kr-know-1", title: "EBS 다큐멘터리", country: "KR", category: "knowledge", description: "한국 대표 다큐 채널" },
  { id: "kr-know-2", title: "지식인사이드", country: "KR", category: "knowledge", description: "쉽게 배우는 지식" },
  { id: "kr-know-3", title: "세바시 강연", country: "KR", category: "knowledge", description: "한국의 TED" },
  { id: "kr-food-1", title: "백종원의 요리비책", country: "KR", category: "lifestyle", description: "쉽고 맛있는 집밥 레시피" },
  { id: "kr-food-2", title: "쿠킹덤", country: "KR", category: "lifestyle", description: "감각적인 요리 채널" },
  { id: "kr-news-1", title: "JTBC News", country: "KR", category: "news", description: "JTBC 뉴스 공식 채널" },
  { id: "kr-news-2", title: "KBS News", country: "KR", category: "news", description: "KBS 뉴스 공식 채널" },
  { id: "kr-ent-1", title: "침착맨", country: "KR", category: "entertainment", description: "이말년의 다양한 콘텐츠" },
  { id: "kr-ent-2", title: "빠니보틀", country: "KR", category: "lifestyle", description: "여행 및 일상 브이로그" },
  { id: "kr-music-1", title: "SMTOWN", country: "KR", category: "music", description: "SM엔터테인먼트 공식 채널" },
  { id: "kr-music-2", title: "HYBE LABELS", country: "KR", category: "music", description: "BTS 소속사 공식 채널" },

  // ── 미국 (US) ──
  { id: "us-tech-1", title: "Fireship", country: "US", category: "tech", description: "100초 코딩 설명의 달인" },
  { id: "us-tech-2", title: "Theo - t3.gg", country: "US", category: "tech", description: "웹 개발 트렌드 분석" },
  { id: "us-know-1", title: "Kurzgesagt", country: "US", category: "knowledge", description: "복잡한 주제를 아름답게 설명" },
  { id: "us-know-2", title: "Veritasium", country: "US", category: "knowledge", description: "과학과 공학의 신비" },
  { id: "us-know-3", title: "CGP Grey", country: "US", category: "knowledge", description: "세상을 설명하는 채널" },
  { id: "us-food-1", title: "Joshua Weissman", country: "US", category: "lifestyle", description: "요리 레시피와 팁" },
  { id: "us-humor-1", title: "Ryan George", country: "US", category: "humor", description: "1인 코미디의 정석" },
  { id: "us-music-1", title: "NPR Music", country: "US", category: "music", description: "라이브 음악 세션" },
  { id: "us-news-1", title: "Vox", country: "US", category: "news", description: "심층 시사 분석" },
  { id: "us-news-2", title: "Johnny Harris", country: "US", category: "news", description: "세계 이슈를 지도로 설명" },
  { id: "us-ent-1", title: "Mark Rober", country: "US", category: "entertainment", description: "엔지니어의 창의적 프로젝트" },
  { id: "us-lifestyle-1", title: "Yes Theory", country: "US", category: "lifestyle", description: "불편한 도전으로 성장" },

  // ── 일본 (JP) ──
  { id: "jp-ent-1", title: "NHK World-Japan", country: "JP", category: "knowledge", description: "일본 문화와 뉴스" },
  { id: "jp-music-1", title: "THE FIRST TAKE", country: "JP", category: "music", description: "원테이크 라이브 공연" },
];

// 유저 취향에 맞는 큐레이션 채널 추천 (이미 구독한 채널 제외)
export function getCuratedRecommendations(
  tasteType: string,
  subscribedIds: Set<string>,
  userCountry: string = "KR",
  limit: number = 5
): CuratedChannel[] {
  const results: CuratedChannel[] = [];

  // 1. 같은 국가 + 같은 카테고리
  const sameCountrySameCategory = CURATED_CHANNELS.filter(
    c => c.country === userCountry && c.category === tasteType && !subscribedIds.has(c.id)
  );
  results.push(...sameCountrySameCategory.slice(0, 2));

  // 2. 해외 + 같은 카테고리
  const foreignSameCategory = CURATED_CHANNELS.filter(
    c => c.country !== userCountry && c.category === tasteType && !subscribedIds.has(c.id)
  );
  results.push(...foreignSameCategory.slice(0, 2));

  // 3. 같은 국가 + 인접 카테고리 (부족하면 채움)
  if (results.length < limit) {
    const fill = CURATED_CHANNELS.filter(
      c => c.country === userCountry && c.category !== tasteType && !subscribedIds.has(c.id)
    );
    results.push(...fill.slice(0, limit - results.length));
  }

  return results.slice(0, limit);
}
