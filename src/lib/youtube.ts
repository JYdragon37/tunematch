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
        const errorBody = await res.json().catch(() => ({}));
        const status = res.status;
        console.error("[YouTube API Error]", status, JSON.stringify(errorBody));

        if (status === 401) throw new Error("YOUTUBE_TOKEN_EXPIRED");
        if (status === 403) throw new Error("YOUTUBE_SCOPE_MISSING");
        if (status === 429) throw new Error("YOUTUBE_QUOTA_EXCEEDED");
        throw new Error(`YOUTUBE_API_ERROR:${status}`);
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
    throw err;
  }

  return channels;
}

// ─── Channel Stats (channels.list) ───

export interface ChannelStat {
  id: string;
  title: string;
  subscriberCount: number;
  country?: string;
  subscribedAt?: string;  // subscription date (from subscription snippet)
}

function formatSubscriberCount(count: number): string {
  if (count >= 100_000_000) return `${(count / 100_000_000).toFixed(1)}억`;
  if (count >= 10_000) return `${(count / 10_000).toFixed(1)}만`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}천`;
  return `${count}`;
}

export async function fetchChannelStats(
  accessToken: string,
  subscriptions: Channel[]  // 이미 가져온 구독 목록 (날짜 포함)
): Promise<ChannelStat[]> {
  if (!accessToken || accessToken.startsWith("mock-")) {
    // Mock 데이터 반환
    return subscriptions.slice(0, 10).map((ch, i) => ({
      id: ch.id,
      title: ch.title,
      subscriberCount: Math.floor(Math.random() * 5_000_000) + 1_000,
      country: i % 3 === 0 ? "US" : "KR",
      subscribedAt: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 3600 * 1000).toISOString(),
    }));
  }

  // 상위 50개 channelId
  const top50 = subscriptions.slice(0, 50).map(c => c.id).filter(Boolean);
  if (top50.length === 0) return [];

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "statistics,snippet");
    url.searchParams.set("id", top50.join(","));
    url.searchParams.set("maxResults", "50");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error("[ChannelStats API Error]", await res.text());
      return [];
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet?.title || "",
      subscriberCount: parseInt(item.statistics?.subscriberCount || "0", 10),
      country: item.snippet?.country,
    }));
  } catch (err) {
    console.error("[fetchChannelStats error]", err);
    return [];
  }
}

// ─── Liked Videos (videos.list) ───

export interface LikedVideo {
  id: string;
  title: string;
  categoryId: string;
  customCategory: CategoryKey;
}

export async function fetchLikedVideos(accessToken: string): Promise<LikedVideo[]> {
  if (!accessToken || accessToken.startsWith("mock-")) {
    return [
      { id: "v1", title: "Mock Liked 1", categoryId: "27", customCategory: "knowledge" },
      { id: "v2", title: "Mock Liked 2", categoryId: "28", customCategory: "tech" },
      { id: "v3", title: "Mock Liked 3", categoryId: "20", customCategory: "entertainment" },
    ];
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("myRating", "like");
    url.searchParams.set("maxResults", "50");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error("[LikedVideos API Error]", await res.text());
      return [];
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => {
      const catId = item.snippet?.categoryId || "20";
      return {
        id: item.id,
        title: item.snippet?.title || "",
        categoryId: catId,
        customCategory: classifyByKeyword(item.snippet?.title || "", item.snippet?.description || ""),
      };
    });
  } catch (err) {
    console.error("[fetchLikedVideos error]", err);
    return [];
  }
}

// ─── 통합 진입점 ───

export interface YouTubeFullData {
  channels: Channel[];
  channelStats: ChannelStat[];
  likedVideos: LikedVideo[];
}

export async function fetchYouTubeData(
  accessToken: string,
  slot: "A" | "B" = "A"
): Promise<YouTubeFullData> {
  // 구독 채널 먼저 가져오기 (channelStats에 필요)
  const channels = await fetchSubscribedChannels(accessToken, slot);

  // 나머지 병렬 처리
  const [channelStats, likedVideos] = await Promise.all([
    fetchChannelStats(accessToken, channels),
    fetchLikedVideos(accessToken),
  ]);

  return { channels, channelStats, likedVideos };
}
