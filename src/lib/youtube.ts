/**
 * YouTube Data API v3 연동
 * Mock 모드에서는 mock-channels.ts의 데이터 반환
 */
import type { Channel, CategoryKey } from "@/types";
import { mockChannelsA, mockChannelsB } from "@/data/mock-channels";

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

// YouTube categoryId → 커스텀 카테고리 매핑
const CATEGORY_MAP: Record<string, CategoryKey> = {
  "10": "music",
  "19": "lifestyle",
  "20": "entertainment",
  "22": "lifestyle",
  "23": "humor",
  "24": "entertainment",
  "25": "news",
  "26": "food",
  "27": "knowledge",
  "28": "tech",
  "34": "humor",
  "44": "news",
};

function mapCategory(ytCategoryId: string): CategoryKey {
  return CATEGORY_MAP[ytCategoryId] || "entertainment";
}

export async function fetchSubscribedChannels(
  accessToken: string,
  userSlot: "A" | "B" = "A"
): Promise<Channel[]> {
  // Mock 모드
  if (isMockMode || accessToken.startsWith("mock-")) {
    console.log(`[Mock] YouTube 구독 채널 반환 (User ${userSlot})`);
    await new Promise((r) => setTimeout(r, 500)); // 실제 API 지연 시뮬레이션
    return userSlot === "A" ? mockChannelsA : mockChannelsB;
  }

  // 실제 YouTube API 호출
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
        console.error("[YouTube API Error]", error);
        break;
      }

      const data = await res.json();
      const items = data.items || [];

      for (const item of items) {
        const snippet = item.snippet;
        const resourceId = snippet.resourceId?.channelId || "";
        const categoryId = snippet.channelId || "20";

        channels.push({
          id: resourceId,
          title: snippet.title,
          thumbnail: snippet.thumbnails?.default?.url || "",
          categoryId,
          customCategory: mapCategory(categoryId),
          description: snippet.description,
        });
      }

      pageToken = data.nextPageToken;
    } while (pageToken && channels.length < 500);
  } catch (err) {
    console.error("[YouTube fetch error]", err);
  }

  return channels;
}
