/**
 * YouTube Data API v3 연동
 * subscriptions API에는 categoryId가 없으므로 채널 제목 키워드로 분류
 */
import type { Channel, CategoryKey } from "@/types";
import { mockChannelsA, mockChannelsB } from "@/data/mock-channels";

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

// 채널 제목/설명 키워드 기반 카테고리 분류
const CATEGORY_KEYWORDS: Record<CategoryKey, string[]> = {
  tech: [
    "tech", "technology", "programming", "coding", "software", "hardware",
    "linux", "python", "javascript", "ai", "machine learning", "startup",
    "developer", "개발", "프로그래밍", "코딩", "it", "computer", "컴퓨터",
    "데이터", "클라우드", "서버", "앱", "디지털", "테크", "스타트업", "투자",
    "재테크", "비즈니스", "경영", "마케팅", "창업",
  ],
  knowledge: [
    "science", "education", "learn", "explain", "history", "documentary",
    "academic", "lecture", "study", "tutorial", "how to", "school",
    "교육", "강의", "지식", "과학", "배움", "공부", "수학", "물리", "화학",
    "역사", "철학", "심리", "언어", "영어", "日本語", "shadowing",
  ],
  humor: [
    "comedy", "funny", "humor", "meme", "lol", "joke", "parody",
    "개그", "코미디", "웃음", "병맛", "쇼츠", "숏폼", "리액션",
  ],
  music: [
    "music", "song", "artist", "singer", "band", "kpop", "pop", "hip hop",
    "jazz", "classical", "mv", "cover", "뮤직", "음악", "가수", "노래",
    "kpop", "아이돌", "공연", "라이브", "뮤비",
  ],
  lifestyle: [
    "vlog", "lifestyle", "travel", "fashion", "beauty", "fitness", "yoga",
    "workout", "브이로그", "여행", "패션", "뷰티", "운동", "헬스", "다이어트",
    "일상", "인테리어", "셀프", "자기계발",
  ],
  food: [
    "food", "cooking", "recipe", "eat", "restaurant", "mukbang", "chef",
    "먹방", "요리", "음식", "레시피", "맛집", "쿡방", "식당", "baking",
  ],
  news: [
    "news", "politics", "economy", "world", "current", "analysis", "report",
    "뉴스", "정치", "경제", "시사", "분석", "사회", "이슈", "매트릭스",
    "글로벌", "국제", "사설", "논평",
  ],
  entertainment: [
    "game", "gaming", "movie", "drama", "anime", "entertainment", "esports",
    "게임", "영화", "드라마", "애니", "웹툰", "예능", "버라이어티", "방송",
    "tvn", "mbc", "kbs", "sbs", "채널a", "jtbc", "joy", "studio",
  ],
};

function classifyByKeyword(title: string, description: string = ""): CategoryKey {
  const text = (title + " " + description).toLowerCase();

  // 점수 기반 분류
  const scores: Record<CategoryKey, number> = {
    tech: 0, knowledge: 0, humor: 0, lifestyle: 0,
    music: 0, news: 0, food: 0, entertainment: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[category as CategoryKey]++;
      }
    }
  }

  const best = (Object.entries(scores) as [CategoryKey, number][])
    .sort((a, b) => b[1] - a[1])[0];

  return best[1] > 0 ? best[0] : "entertainment";
}

export async function fetchSubscribedChannels(
  accessToken: string,
  userSlot: "A" | "B" = "A"
): Promise<Channel[]> {
  if (isMockMode || !accessToken || accessToken.startsWith("mock-")) {
    console.log(`[Mock] YouTube 구독 채널 반환 (User ${userSlot})`);
    await new Promise((r) => setTimeout(r, 300));
    return userSlot === "A" ? mockChannelsA : mockChannelsB;
  }

  const channels: Channel[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const url = new URL("https://www.googleapis.com/youtube/v3/subscriptions");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("mine", "true");
      url.searchParams.set("maxResults", "50");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("[YouTube API Error]", JSON.stringify(error));
        if (channels.length === 0) {
          console.log("[YouTube] API 실패, mock 데이터로 폴백");
          return userSlot === "A" ? mockChannelsA : mockChannelsB;
        }
        break;
      }

      const data = await res.json();
      const items = data.items || [];

      for (const item of items) {
        const snippet = item.snippet;
        const channelId = snippet.resourceId?.channelId || "";
        const title = snippet.title || "";
        const description = snippet.description || "";

        // subscriptions API에는 categoryId 없음 → 제목 키워드로 분류
        const customCategory = classifyByKeyword(title, description);

        channels.push({
          id: channelId,
          title,
          thumbnail: snippet.thumbnails?.default?.url || "",
          categoryId: customCategory,  // keyword 분류 결과 저장
          customCategory,
          description,
        });
      }

      pageToken = data.nextPageToken;
    } while (pageToken && channels.length < 500);

    console.log(`[YouTube] 구독 채널 ${channels.length}개 수집 완료`);
  } catch (err) {
    console.error("[YouTube fetch error]", err);
  }

  return channels;
}
