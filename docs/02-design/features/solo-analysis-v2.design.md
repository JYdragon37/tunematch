# Design: 솔로 취향 분석 v2

**Architecture**: Option C — 실용적 균형 (fetchYouTubeData 통합 진입점)
**Date**: 2026-04-11

---

## Context Anchor

| WHY | 카테고리 비중만 보던 솔로 분석을 채널별 구체 데이터(통계, 날짜, 좋아요)로 심화 |
|-----|---|
| WHO | 자신의 유튜브 역사를 재미있게 돌아보고 싶은 유저 |
| RISK | 채널 통계 API 실패 시 graceful fallback 필요. 좋아요 비공개 유저 예외처리 |
| SUCCESS | 5개 신규 섹션 표시. 실제 채널 데이터 반영. 기존 인사이트 영향 없음 |
| SCOPE | youtube.ts + algorithm.ts + types + solo route + 3개 신규 컴포넌트 |

---

## 1. API 함수 설계 (youtube.ts)

### fetchYouTubeData() — 통합 진입점

```typescript
export async function fetchYouTubeData(accessToken: string, slot: "A" | "B") {
  const [channels, statsAndDates, liked] = await Promise.all([
    fetchSubscribedChannels(accessToken, slot),     // 기존
    fetchChannelStats(accessToken),                  // 신규: 상위 50개 통계
    fetchLikedVideos(accessToken),                   // 신규: 좋아요 50개
  ]);
  return { channels, statsAndDates, liked };
}
```

### fetchChannelStats(token) — channels.list

```
GET https://www.googleapis.com/youtube/v3/channels
  ?part=statistics,snippet
  &mine=true          ← 내 채널 정보 (업로더 기준)

실제로는 subscriptions 첫 50개의 channelId를 모아서:
GET ?part=statistics,snippet&id=id1,id2,...&maxResults=50

응답에서 추출:
  - statistics.subscriberCount
  - statistics.videoCount
  - snippet.country
  - subscription.snippet.publishedAt (구독 날짜, subscriptions 응답에서)
```

### fetchLikedVideos(token) — videos.list

```
GET https://www.googleapis.com/youtube/v3/videos
  ?part=snippet
  &myRating=like
  &maxResults=50

응답에서 추출:
  - snippet.categoryId → customCategory
  - snippet.channelId
```

---

## 2. 알고리즘 함수 설계 (algorithm.ts)

### analyzeChannelStats()

```typescript
interface ChannelStatResult {
  topSubscriber: { title: string; count: number; formatted: string };
  smallestSubscriber: { title: string; count: number; formatted: string };
  oldestSub: { title: string; date: string; yearsAgo: number };
  newestSub: { title: string; date: string };
  hiddenFanCount: number;    // 구독자 10만 이하
  hiddenFanPercent: number;
  countryDist: { code: string; label: string; count: number; percent: number }[];
}
```

### analyzeLikedVideos()

```typescript
interface LikedVideoInsight {
  topCategory: CategoryKey;
  topCategoryLabel: string;
  matchScore: number;        // 구독 카테고리 벡터와 좋아요 카테고리 유사도 0~100
  surpriseCategory?: CategoryKey;  // 구독엔 없는데 좋아요엔 많은 카테고리
  surpriseCategoryLabel?: string;
  totalLiked: number;
}
```

---

## 3. 추천 채널 큐레이션 데이터 (curated-channels.ts)

국가별 × 취향별 큐레이션 (정적, 쿼터 절약):

```typescript
// 한국(KR) + 해외(US) 취향별 인기 채널
// 유저가 이미 구독한 채널 ID는 필터링
const CURATED: CuratedChannel[] = [
  // KR tech
  { id:"UCtHm...", title:"노마드 코더", country:"KR", category:"tech" },
  // KR knowledge
  { id:"UC...",    title:"EBS 다큐",   country:"KR", category:"knowledge" },
  // US tech
  { id:"UCsBj...", title:"Fireship",   country:"US", category:"tech" },
  ...
]
```

---

## 4. 타입 추가 (types/index.ts)

```typescript
export interface ChannelStatItem {
  title: string;
  subscriberCount: number;
  formattedCount: string;   // "1.2M", "34.5만" 등
  subscribedAt?: string;    // ISO date
  yearsAgo?: number;
  country?: string;
}

export interface ChannelStatsData {
  topSubscriber: ChannelStatItem;
  smallestSubscriber: ChannelStatItem;
  oldestSub: ChannelStatItem;
  newestSub: ChannelStatItem;
  hiddenFanCount: number;
  hiddenFanPercent: number;
  countryDist: { code: string; label: string; percent: number }[];
}

export interface LikedVideoInsight {
  topCategory: CategoryKey;
  topCategoryLabel: string;
  matchScore: number;
  surpriseCategory?: CategoryKey;
  surpriseCategoryLabel?: string;
  totalLiked: number;
}

// MatchResult 추가 (optional)
// channelStatsData?: ChannelStatsData;
// likedVideoInsight?: LikedVideoInsight;
// curatedRecommendations?: CuratedChannel[];  (기존 recommendations 대체 가능)
```

---

## 5. UI 컴포넌트

### ChannelRecordCard.tsx
```
┌─────────────────────────────────┐
│ 🏆 나의 구독 기록관              │
│                                 │
│ 👑 구독자 최다   MrBeast 2.4억  │
│ 🤍 구독자 최소   코딩하는사람 1.2만│
│ 📅 가장 오래전   유튜브 2014년부터 │
│     NHK World Japan             │
│ 🆕 가장 최근    Fireship (3일 전) │
│                                 │
│ 🕵️ 소채널 팬: 구독자 10만 이하   │
│     채널 47개 구독 중 (18%)      │
└─────────────────────────────────┘
```

### CountryDistribution.tsx
```
┌─────────────────────────────────┐
│ 🌍 구독 채널 국가 분포           │
│                                 │
│ 🇰🇷 한국   ██████████ 67%     │
│ 🇺🇸 미국   ████░░░░░░ 25%     │
│ 🇯🇵 일본   █░░░░░░░░░  8%     │
│                                 │
│ 📺 이런 한국 채널도 구독해보세요  │
│ [채널A] [채널B] [채널C]          │
└─────────────────────────────────┘
```

### LikedVideoInsight.tsx
```
┌─────────────────────────────────┐
│ ❤️ 좋아요 영상 분석              │
│ 최근 50개 좋아요 영상 기준       │
│                                 │
│ 주로 좋아하는 영상: 지식/교육     │
│ 구독 취향과 일치도: 73%          │
│                                 │
│ ⚡ 숨겨진 취향 발견!             │
│ 구독은 안 했지만 뉴스 영상을     │
│ 자주 좋아요 누르고 있어요        │
└─────────────────────────────────┘
```

---

## 6. 구현 순서 (Session Guide)

### Module 1 — 데이터 레이어
1. `src/types/index.ts`: 신규 타입 추가
2. `src/lib/youtube.ts`: `fetchChannelStats`, `fetchLikedVideos`, `fetchYouTubeData` 추가
3. `src/lib/algorithm.ts`: `analyzeChannelStats`, `analyzeLikedVideos` 추가
4. `src/data/curated-channels.ts`: 큐레이션 데이터 생성

### Module 2 — API + DB
5. `src/app/api/match/solo/route.ts`: `fetchYouTubeData` 사용으로 교체
6. `src/lib/db.ts`: `channel_stats_data`, `liked_video_insight` 저장/조회

### Module 3 — UI
7. `src/components/result/ChannelRecordCard.tsx`
8. `src/components/result/CountryDistribution.tsx`
9. `src/components/result/LikedVideoInsight.tsx`
10. `src/components/result/SoloResultView.tsx`: 3개 섹션 추가
