import type { CuratedChannel } from "@/types";

export const CURATED_CHANNELS: CuratedChannel[] = [
  // ── 한국 (KR) ──
  { id: "kr-tech-1", title: "노마드 코더", country: "KR", category: "tech", description: "한국 최고의 코딩 교육 채널", subscriberCount: "53만" },
  { id: "kr-tech-2", title: "조코딩 JoCoding", country: "KR", category: "tech", description: "실무 개발자의 코딩 이야기", subscriberCount: "47만" },
  { id: "kr-tech-3", title: "드림코딩", country: "KR", category: "tech", description: "모던 웹 개발 강의", subscriberCount: "54만" },
  { id: "kr-tech-4", title: "슈카월드", country: "KR", category: "tech", description: "경제·트렌드 분석의 정석", subscriberCount: "220만" },
  { id: "kr-know-1", title: "EBS 다큐멘터리", country: "KR", category: "knowledge", description: "한국 대표 다큐 채널", subscriberCount: "160만" },
  { id: "kr-know-2", title: "지식인사이드", country: "KR", category: "knowledge", description: "쉽게 배우는 지식", subscriberCount: "50만" },
  { id: "kr-know-3", title: "세바시 강연", country: "KR", category: "knowledge", description: "한국의 TED", subscriberCount: "130만" },
  { id: "kr-know-4", title: "사피엔스 스튜디오", country: "KR", category: "knowledge", description: "인문학·철학 채널", subscriberCount: "68만" },
  { id: "kr-food-1", title: "백종원의 요리비책", country: "KR", category: "food", description: "쉽고 맛있는 집밥 레시피", subscriberCount: "570만" },
  { id: "kr-food-2", title: "쿠킹덤", country: "KR", category: "food", description: "감각적인 요리 채널", subscriberCount: "30만" },
  { id: "kr-food-3", title: "마카롱TV", country: "KR", category: "food", description: "맛집 탐방 전문", subscriberCount: "45만" },
  { id: "kr-news-1", title: "JTBC News", country: "KR", category: "news", description: "JTBC 뉴스 공식 채널", subscriberCount: "200만" },
  { id: "kr-news-2", title: "KBS News", country: "KR", category: "news", description: "KBS 뉴스 공식 채널", subscriberCount: "200만" },
  { id: "kr-news-3", title: "한문철TV", country: "KR", category: "news", description: "교통사고 법률 정보", subscriberCount: "280만" },
  { id: "kr-ent-1", title: "침착맨", country: "KR", category: "entertainment", description: "이말년의 다양한 콘텐츠", subscriberCount: "270만" },
  { id: "kr-ent-2", title: "빠니보틀", country: "KR", category: "lifestyle", description: "여행 및 일상 브이로그", subscriberCount: "220만" },
  { id: "kr-ent-3", title: "워크맨-Workman", country: "KR", category: "entertainment", description: "아르바이트 체험 예능", subscriberCount: "350만" },
  { id: "kr-humor-1", title: "피식대학Psick Univ", country: "KR", category: "humor", description: "K-시트콤 명가", subscriberCount: "300만" },
  { id: "kr-music-1", title: "SMTOWN", country: "KR", category: "music", description: "SM엔터테인먼트 공식 채널", subscriberCount: "3100만" },
  { id: "kr-music-2", title: "HYBE LABELS", country: "KR", category: "music", description: "BTS 소속사 공식 채널", subscriberCount: "7500만" },
  { id: "kr-lifestyle-1", title: "슬기로운 의사생활", country: "KR", category: "lifestyle", description: "자기계발·라이프 채널", subscriberCount: "40만" },

  // ── 미국 (US) ──
  { id: "us-tech-1", title: "Fireship", country: "US", category: "tech", description: "100초 코딩 설명의 달인", subscriberCount: "300만" },
  { id: "us-tech-2", title: "Theo - t3.gg", country: "US", category: "tech", description: "웹 개발 트렌드 분석", subscriberCount: "60만" },
  { id: "us-tech-3", title: "Linus Tech Tips", country: "US", category: "tech", description: "PC·가젯 리뷰 최강", subscriberCount: "1600만" },
  { id: "us-know-1", title: "Kurzgesagt", country: "US", category: "knowledge", description: "복잡한 주제를 아름답게 설명", subscriberCount: "2200만" },
  { id: "us-know-2", title: "Veritasium", country: "US", category: "knowledge", description: "과학과 공학의 신비", subscriberCount: "1700만" },
  { id: "us-know-3", title: "CGP Grey", country: "US", category: "knowledge", description: "세상을 설명하는 채널", subscriberCount: "650만" },
  { id: "us-know-4", title: "Wendover Productions", country: "US", category: "knowledge", description: "지리·경제·항공 분석", subscriberCount: "550만" },
  { id: "us-food-1", title: "Joshua Weissman", country: "US", category: "food", description: "요리 레시피와 팁", subscriberCount: "900만" },
  { id: "us-food-2", title: "Binging with Babish", country: "US", category: "food", description: "영화 속 요리 재현", subscriberCount: "1000만" },
  { id: "us-humor-1", title: "Ryan George", country: "US", category: "humor", description: "1인 코미디의 정석", subscriberCount: "200만" },
  { id: "us-humor-2", title: "Casually Explained", country: "US", category: "humor", description: "냉소적 애니메이션 유머", subscriberCount: "400만" },
  { id: "us-music-1", title: "NPR Music", country: "US", category: "music", description: "라이브 음악 세션", subscriberCount: "380만" },
  { id: "us-news-1", title: "Vox", country: "US", category: "news", description: "심층 시사 분석", subscriberCount: "1100만" },
  { id: "us-news-2", title: "Johnny Harris", country: "US", category: "news", description: "세계 이슈를 지도로 설명", subscriberCount: "600만" },
  { id: "us-ent-1", title: "Mark Rober", country: "US", category: "entertainment", description: "엔지니어의 창의적 프로젝트", subscriberCount: "5000만" },
  { id: "us-lifestyle-1", title: "Yes Theory", country: "US", category: "lifestyle", description: "불편한 도전으로 성장", subscriberCount: "900만" },

  // ── 일본 (JP) ──
  { id: "jp-know-1", title: "NHK World-Japan", country: "JP", category: "knowledge", description: "일본 문화와 뉴스", subscriberCount: "200만" },
  { id: "jp-music-1", title: "THE FIRST TAKE", country: "JP", category: "music", description: "원테이크 라이브 공연", subscriberCount: "700만" },
  { id: "jp-ent-1", title: "Fischer's-フィッシャーズ-", country: "JP", category: "entertainment", description: "일본 최고 엔터 채널", subscriberCount: "950만" },
];

// 요즘 뜨는 채널 (isTrending: true)
export const TRENDING_CHANNELS: CuratedChannel[] = [
  // 한국
  { id: "tr-kr-1", title: "결국", country: "KR", category: "news", description: "사회 이슈 심층 분석 채널", subscriberCount: "85만", isTrending: true },
  { id: "tr-kr-2", title: "핵인싸 활동가들", country: "KR", category: "entertainment", description: "요즘 핫한 버라이어티", subscriberCount: "60만", isTrending: true },
  { id: "tr-kr-3", title: "코딩애플", country: "KR", category: "tech", description: "쉬운 코딩 강의", subscriberCount: "40만", isTrending: true },
  { id: "tr-kr-4", title: "주언규", country: "KR", category: "knowledge", description: "성장·자기계발 인사이트", subscriberCount: "95만", isTrending: true },
  { id: "tr-kr-5", title: "셔먹방", country: "KR", category: "food", description: "요즘 뜨는 먹방 채널", subscriberCount: "35만", isTrending: true },
  { id: "tr-kr-6", title: "지무비", country: "KR", category: "entertainment", description: "영화 리뷰·분석 신흥강자", subscriberCount: "55만", isTrending: true },
  // 미국
  { id: "tr-us-1", title: "Internet Historian", country: "US", category: "entertainment", description: "인터넷 역사 다큐", subscriberCount: "500만", isTrending: true },
  { id: "tr-us-2", title: "Andrej Karpathy", country: "US", category: "tech", description: "AI·딥러닝 강의", subscriberCount: "120만", isTrending: true },
  { id: "tr-us-3", title: "Pirate Wires", country: "US", category: "news", description: "테크 문화 비평", subscriberCount: "30만", isTrending: true },
  // 일본
  { id: "tr-jp-1", title: "PIVOT 公式チャンネル", country: "JP", category: "news", description: "일본 비즈니스 뉴스", subscriberCount: "100만", isTrending: true },
];

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
  results.push(...sameCountrySameCategory.slice(0, 3));

  // 2. 해외 + 같은 카테고리
  if (results.length < limit) {
    const foreignSameCategory = CURATED_CHANNELS.filter(
      c => c.country !== userCountry && c.category === tasteType && !subscribedIds.has(c.id)
    );
    results.push(...foreignSameCategory.slice(0, limit - results.length));
  }

  // 3. 같은 국가 + 인접 카테고리 (부족하면 채움)
  if (results.length < limit) {
    const fill = CURATED_CHANNELS.filter(
      c => c.country === userCountry && c.category !== tasteType && !subscribedIds.has(c.id)
    );
    results.push(...fill.slice(0, limit - results.length));
  }

  return results.slice(0, limit);
}

export function getTrendingRecommendations(
  tasteType: string,
  subscribedIds: Set<string>,
  userCountry: string = "KR",
  limit: number = 5
): CuratedChannel[] {
  const results: CuratedChannel[] = [];

  // 1. 같은 국가 + 같은 카테고리 트렌딩
  const sameCountrySame = TRENDING_CHANNELS.filter(
    c => c.country === userCountry && c.category === tasteType && !subscribedIds.has(c.id)
  );
  results.push(...sameCountrySame);

  // 2. 같은 국가 + 다른 카테고리 트렌딩
  if (results.length < limit) {
    const sameCountryOther = TRENDING_CHANNELS.filter(
      c => c.country === userCountry && c.category !== tasteType && !subscribedIds.has(c.id)
    );
    results.push(...sameCountryOther.slice(0, limit - results.length));
  }

  // 3. 해외 트렌딩 (부족하면)
  if (results.length < limit) {
    const foreign = TRENDING_CHANNELS.filter(
      c => c.country !== userCountry && !subscribedIds.has(c.id)
    );
    results.push(...foreign.slice(0, limit - results.length));
  }

  return results.slice(0, limit);
}
