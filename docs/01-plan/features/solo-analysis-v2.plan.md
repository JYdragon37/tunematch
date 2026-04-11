# Plan: 솔로 취향 분석 v2 — 채널 데이터 심화 인사이트

**Feature ID**: solo-analysis-v2
**Date**: 2026-04-11
**Status**: Plan

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | 솔로 취향 분석 v2 — 채널 데이터 심화 인사이트 |
| 시작일 | 2026-04-11 |
| 목표 | YouTube API 추가 데이터(채널 통계, 구독 날짜, 좋아요 영상)로 개인화된 재미 인사이트 5종 추가 |

### Value Delivered (4관점)

| 관점 | 내용 |
|------|------|
| Problem | 현재 인사이트는 카테고리 분포만 분석. 실제 구독 채널의 구체적 데이터(구독자 수, 구독 날짜, 좋아요)를 활용하지 않음 |
| Solution | channels.list(통계), subscriptions publishedAt(날짜), videos.list(좋아요) 세 API로 5가지 심화 인사이트 추가 |
| Function UX Effect | "2015년부터 구독한 레전드 채널", "구독자 1,234명 소채널 팬" 같은 개인화된 재미 요소 → 공유 욕구 자극 |
| Core Value | 유저의 유튜브 역사와 취향 깊이를 드러내는 고유한 데이터 포트레이트 |

---

## Context Anchor

| WHY | 현재 솔로 분석은 카테고리 비중만 본다. 유저가 실제로 구독한 채널의 구체적 스토리가 더 재밌다 |
|-----|---|
| WHO | 자신의 유튜브 취향을 재미있게 돌아보고 싶은 유저. SNS에 공유하고 싶은 인사이트 원하는 사람 |
| RISK | channels.list API 호출 비용(50채널 = 1쿼터). 좋아요 영상 없는 유저 예외처리 |
| SUCCESS | 5개 인사이트 섹션 정상 표시, 실제 채널 데이터 반영 확인 |
| SCOPE | youtube.ts + algorithm.ts + types + solo route + SoloResultView |

---

## 1. 신규 인사이트 5종

### 1-1. 🏆 나의 구독 기록관
**데이터**: `channels.list?part=statistics` (상위 50개 샘플) + `subscriptions.publishedAt`

| 항목 | 설명 |
|------|------|
| 구독자 최다 채널 | 내가 구독한 채널 중 가장 큰 채널 (e.g., MrBeast 2.4억 명) |
| 구독자 최소 채널 | 내가 구독한 채널 중 가장 작은 채널 (진정한 팬의 증거) |
| 가장 오래된 구독 | `publishedAt` 기준 가장 오래된 구독 날짜 + 채널명 |
| 가장 최근 구독 | `publishedAt` 기준 가장 최근 구독 채널 |

### 1-2. 🕵️ 숨겨진 팬 발굴
**데이터**: `channels.list?part=statistics` — 구독자 10만 이하 채널

- 구독자 수 기준으로 "소채널 팬" 여부 판단
- "당신은 구독자 X만 이하 소채널 N개를 구독 중이에요"
- 희귀도와 연계: 소채널 비율이 높을수록 희귀 취향 점수 가산

### 1-3. 🌍 국가별 취향 분포
**데이터**: `channels.list?part=snippet` — `country` 필드

- 채널의 국가 코드(KR, US, JP 등) 집계
- "한국 채널 67% / 해외 채널 33%"
- 상위 3개국 표시

### 1-4. 📺 국가 기반 미구독 채널 추천
**데이터**: 취향 유형 + 국가 분포 → 큐레이션된 추천 목록 (정적 데이터)

- 유저의 취향 유형 + 주요 국가(KR/US/JP)를 기반으로
- 이미 구독한 채널 제외 후 추천
- 정적 큐레이션 데이터 (YouTube search API 불필요, 쿼터 절약)

### 1-5. ❤️ 좋아요 영상 기반 취향 확인
**데이터**: `videos.list?myRating=like&part=snippet&maxResults=50`

- 좋아요 영상의 카테고리 분포 분석
- "구독 채널 취향 vs 좋아요 영상 취향" 비교
- 불일치시: "구독은 안 했지만 이런 영상도 좋아하는군요 🤔"

---

## 2. YouTube API 호출 설계

```
현재 (1회):
  subscriptions.list?part=snippet&mine=true  (50개씩 페이지네이션)

추가 (최초 분석 시):
  channels.list?part=statistics,snippet&id={상위50개 channelId}  (1회, 50개)
  videos.list?myRating=like&part=snippet&maxResults=50           (1회)

총 추가 API 호출: 2회 (쿼터: ~2유닛)
채널 통계 샘플링: 구독 채널 첫 50개만 (빠른 응답 우선)
```

---

## 3. 데이터 흐름

```
fetchSubscribedChannels()
  └── subscriptions.list (기존, 전체 채널)
  └── channels.list 상위 50개 통계 (신규)  ← channelStats[]
  └── videos.list 좋아요 50개 (신규)       ← likedVideos[]

analyzeChannelStats(channelStats, subscriptions)
  └── 구독자 최다/최소 채널
  └── 가장 오래된/최근 구독 (publishedAt)
  └── 소채널 비율
  └── 국가 분포

analyzeLikedVideos(likedVideos)
  └── 카테고리 분포
  └── 구독 취향 vs 좋아요 취향 일치도
```

---

## 4. 타입 추가

```typescript
// MatchResult 추가 필드
interface ChannelStats {
  id: string;
  title: string;
  subscriberCount: number;
  country?: string;
  subscribedAt?: string;  // ISO date
}

// MatchResult 신규 선택 필드
channelStatsData?: {
  topChannel: ChannelStats;      // 구독자 최다
  smallestChannel: ChannelStats; // 구독자 최소
  oldestSubscription: ChannelStats & { years: number };
  newestSubscription: ChannelStats;
  hiddenFanCount: number;        // 구독자 10만 이하 채널 수
  countryDistribution: { country: string; label: string; percentage: number }[];
};
likedVideoInsight?: {
  topCategory: CategoryKey;
  matchScore: number;  // 구독 취향과 일치도 0~100
  surpriseCategory?: CategoryKey;  // 구독엔 없는데 좋아요 많은 카테고리
};
```

---

## 5. 큐레이션 추천 채널 데이터 구조

```typescript
// src/data/curated-channels.ts
interface CuratedChannel {
  id: string;
  title: string;
  country: "KR" | "US" | "JP" | "GB";
  category: TasteType;
  subscriberCount: string;  // "1.2M"
  description: string;
}
```

한국(KR) 취향별 채널 + 해외(US/JP) 인기 채널 각 카테고리별 3~5개 큐레이션.

---

## 6. 수정/추가 파일 목록

| 파일 | 작업 | 내용 |
|------|------|------|
| `src/lib/youtube.ts` | 수정 | `fetchChannelStats(channelIds[])`, `fetchLikedVideos(token)` 추가 |
| `src/lib/algorithm.ts` | 수정 | `analyzeChannelStats()`, `analyzeLikedVideos()` 추가 |
| `src/types/index.ts` | 수정 | `ChannelStats`, `channelStatsData`, `likedVideoInsight` 타입 추가 |
| `src/app/api/match/solo/route.ts` | 수정 | 신규 API 호출 + 결과 저장 |
| `src/lib/db.ts` | 수정 | channel_stats_data, liked_video_insight 컬럼 저장 |
| `src/data/curated-channels.ts` | 신규 | 국가별 취향별 추천 채널 큐레이션 |
| `src/components/result/ChannelRecordCard.tsx` | 신규 | 구독 기록관 UI |
| `src/components/result/CountryDistribution.tsx` | 신규 | 국가별 분포 UI |
| `src/components/result/LikedVideoInsight.tsx` | 신규 | 좋아요 취향 비교 UI |
| `src/components/result/SoloResultView.tsx` | 수정 | 3개 섹션 추가 |

---

## 7. Supabase 마이그레이션

```sql
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS channel_stats_data JSONB;
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS liked_video_insight JSONB;
```

---

## 8. 성공 기준

- [ ] 구독자 최다/최소/오래된/최근 채널 정확히 표시
- [ ] 소채널(10만 이하) 개수 표시
- [ ] 국가 분포 파이/바 표시
- [ ] 취향 기반 미구독 채널 3~5개 추천 (이미 구독한 채널 제외)
- [ ] 좋아요 영상 분석 (좋아요 없는 유저: "비공개 설정" 안내)
- [ ] 기존 인사이트(v1) 영향 없음
