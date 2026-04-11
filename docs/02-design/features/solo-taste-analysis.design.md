# Design: 솔로 취향 분석 업그레이드

**Feature ID**: solo-taste-analysis
**Architecture**: Option C — 실용적 균형
**Date**: 2026-04-11
**Status**: Design

---

## Context Anchor

| WHY | 혼자 분석이 비교 결과처럼 보여서 어색함. 개인 취향 진단으로 독립적 가치를 줘야 함 |
|-----|---|
| WHO | TuneMatch 첫 방문자, 친구에게 링크 보내기 전 본인 먼저 확인하는 유저 |
| RISK | 8개 유형 분류 로직이 단순 카테고리 비중만으로는 변별력이 낮을 수 있음 |
| SUCCESS | 솔로 결과 화면 공유율 증가, "내 취향 유형" 텍스트가 공유 카드에 표시 |
| SCOPE | algorithm.ts 함수 추가 + solo API 수정 + SoloResultView 신규 + types 확장 |

---

## 1. 아키텍처 결정: Option C

```
MatchResult (기존 타입 확장)
  ├── 기존 필드 유지 (비교 플로우 무영향)
  └── 솔로 전용 선택 필드 추가
        tasteType?: TasteType
        diversityIndex?: number
        friendType?: TasteType
        friendTypeReason?: string
        topCategories?: TopCategory[]

result/[matchId]/page.tsx
  ├── isSolo = result.tasteType !== undefined
  ├── isSolo → <SoloResultView result={result} />
  └── !isSolo → 기존 비교 UI (변경 없음)
```

**선택 이유**: 비교 플로우 regression 위험 최소화. 타입 확장으로 API 호환성 유지. UI만 완전 분리.

---

## 2. 타입 정의

### 2-1. 기존 types/index.ts 추가

```typescript
// 취향 유형 8개
export type TasteType =
  | "knowledge"    // 🧠 지식 탐험가형
  | "entertainment" // 🎮 엔터 마니아형
  | "humor"        // 😂 유머 감성파형
  | "music"        // 🎵 뮤직 비주얼형
  | "lifestyle"    // 🍳 미식 라이프형
  | "news"         // 📰 시사 분석가형
  | "tech"         // 💻 테크 인사이더형
  | "collector";   // 🌈 취향 콜렉터형

export interface TopCategory {
  key: CategoryKey;
  label: string;
  percentage: number;    // 0~100
  emoji: string;
}

// MatchResult에 추가 (선택 필드)
// tasteType?: TasteType;
// diversityIndex?: number;       // 0~100 (0=집중, 100=다양)
// friendType?: TasteType;
// friendTypeReason?: string;
// topCategories?: TopCategory[];
```

### 2-2. TasteType 메타데이터

```typescript
export const TASTE_TYPE_META: Record<TasteType, {
  emoji: string;
  label: string;
  description: string;
  color: string;
}> = {
  knowledge:     { emoji: "🧠", label: "지식 탐험가형", description: "배우고 이해하는 데 진심인 사람. 유튜브가 두 번째 교과서예요.", color: "#6366F1" },
  entertainment: { emoji: "🎮", label: "엔터 마니아형", description: "콘텐츠 자체를 즐기는 진짜 팬. 알고리즘이 친구 같은 사람.", color: "#F59E0B" },
  humor:         { emoji: "😂", label: "유머 감성파형", description: "웃음에 진심인 사람. 당신의 피드는 항상 유쾌해요.", color: "#EF4444" },
  music:         { emoji: "🎵", label: "뮤직 비주얼형", description: "감성과 리듬으로 세상을 느끼는 타입. 취향의 색깔이 선명해요.", color: "#EC4899" },
  lifestyle:     { emoji: "🍳", label: "미식 라이프형", description: "먹고 사는 것에 진지하게 진심인 사람. 삶의 질에 투자해요.", color: "#10B981" },
  news:          { emoji: "📰", label: "시사 분석가형", description: "세상 돌아가는 것에 예민하게 관심 있는 타입.", color: "#64748B" },
  tech:          { emoji: "💻", label: "테크 인사이더형", description: "기술 트렌드를 먼저 파악하는 얼리어답터.", color: "#3B82F6" },
  collector:     { emoji: "🌈", label: "취향 콜렉터형", description: "특정 장르 없이 넓게 보는 다양성의 왕. 모든 것이 취향이에요.", color: "#8B5CF6" },
};
```

---

## 3. 알고리즘 설계 (algorithm.ts 추가)

### 3-1. classifyTasteType()

```typescript
function classifyTasteType(vec: CategoryVector): TasteType {
  // 1순위: 강한 지배 카테고리 체크
  if (vec.tech > 0.30) return "tech";
  if (vec.knowledge + vec.tech > 0.40) return "knowledge";
  if (vec.entertainment > 0.30) return "entertainment";
  if (vec.humor > 0.25) return "humor";
  if (vec.music > 0.30) return "music";
  if (vec.food + vec.lifestyle > 0.35) return "lifestyle";
  if (vec.news > 0.25) return "news";
  // 기본: 취향 콜렉터형
  return "collector";
}
```

### 3-2. calcDiversityIndex() — HHI 역산

```typescript
function calcDiversityIndex(vec: CategoryVector): number {
  const values = Object.values(vec) as number[];
  const hhi = values.reduce((sum, v) => sum + v * v, 0);
  // HHI: 1.0(완전집중) ~ 0.125(완전균등)
  // 다양성 점수: 0(집중) ~ 100(다양)
  return Math.round((1 - hhi) / (1 - 0.125) * 100);
}
```

### 3-3. getTopCategories()

```typescript
function getTopCategories(vec: CategoryVector): TopCategory[] {
  const EMOJI_MAP = { entertainment:"🎮", knowledge:"📚", humor:"😂",
    lifestyle:"🍳", music:"🎵", news:"📰", food:"🍜", tech:"💻" };
  const LABEL_MAP = { entertainment:"엔터/게임", knowledge:"지식/교육",
    humor:"유머/밈", lifestyle:"라이프스타일", music:"음악", news:"뉴스/시사",
    food:"음식/요리", tech:"테크/비즈니스" };

  return (Object.entries(vec) as [CategoryKey, number][])
    .map(([key, val]) => ({
      key, percentage: Math.round(val * 100),
      label: LABEL_MAP[key], emoji: EMOJI_MAP[key],
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .filter(c => c.percentage > 0)
    .slice(0, 5);
}
```

### 3-4. getFriendType()

```typescript
const FRIEND_TYPE_MAP: Record<TasteType, { type: TasteType; reason: string }> = {
  knowledge:     { type: "entertainment", reason: "지식에 유머를 더해주는 사이. 대화가 끊이질 않아요." },
  entertainment: { type: "knowledge",     reason: "엔터에 깊이를 더해주는 사이. 유튜브 추천이 매번 새로워요." },
  humor:         { type: "lifestyle",     reason: "같이 있으면 웃고 먹고 행복해지는 조합이에요." },
  music:         { type: "collector",     reason: "음악 외에도 다양한 취향을 공유할 수 있는 사이예요." },
  lifestyle:     { type: "humor",         reason: "맛있는 것 먹으며 웃을 수 있는 찐 친구 조합이에요." },
  news:          { type: "knowledge",     reason: "세상 이야기를 같이 분석하는 토론 파트너예요." },
  tech:          { type: "knowledge",     reason: "기술과 지식의 교집합. 대화 레벨이 딱 맞아요." },
  collector:     { type: "music",         reason: "다양한 취향에 감성을 더해주는 조합이에요." },
};
```

---

## 4. API 설계 (/api/match/solo — 수정)

### Request (변경 없음)
```
POST /api/match/solo
{ matchId: string }
```

### Response (확장)
```typescript
{
  resultId: string,
  // MatchResult 내부 추가 필드:
  // tasteType: TasteType
  // diversityIndex: number
  // friendType: TasteType
  // friendTypeReason: string
  // topCategories: TopCategory[]
}
```

### 로직 변경

```typescript
// 기존 soloComments 하드코딩 제거
// 신규 algorithm 함수 호출:
const tasteType = classifyTasteType(vecA);
const diversityIndex = calcDiversityIndex(vecA);
const topCategories = getTopCategories(vecA);
const { type: friendType, reason: friendTypeReason } = getFriendType(tasteType);
const { comment, commentType } = generateSoloComment(tasteType, diversityIndex);
```

---

## 5. 컴포넌트 설계

### 5-1. SoloResultView.tsx

```
SoloResultView
├── Header (이름 + "의 유튜브 취향 분석")
├── TasteTypeBadge (① 취향 유형 카드)
├── RadarChartComponent - solo 1선 (② DNA)
├── DiversityGauge (③ 집중도)
├── TopCategoriesBar (④ TOP 취향)
├── FriendTypeCard (⑤ 친구 취향)
├── RecommendedChannels (⑥ 추천 채널)
└── SoloCTASection (⑦ 궁합 분석 CTA)
```

### 5-2. TasteTypeBadge.tsx

```
┌─────────────────────────────┐
│  💻                         │
│  테크 인사이더형              │
│  기술 트렌드를 먼저 파악하는  │
│  얼리어답터.                 │
└─────────────────────────────┘
```
- 유형별 배경 컬러 (TASTE_TYPE_META.color 기반)
- 카운트업 애니메이션으로 등장

### 5-3. DiversityGauge.tsx

```
취향 집중도
집중형 ●━━━━━━━━━━━━━━● 다양형
        ██████████░░░░  68점
        "여러 장르를 골고루 즐기는 타입"
```
- CSS transition으로 게이지 채워지는 애니메이션

### 5-4. FriendTypeCard.tsx

```
┌─────────────────────────────┐
│ 나와 잘 맞을 친구 취향       │
│                             │
│ 🎮 엔터 마니아형             │
│ "지식에 유머를 더해주는 사이. │
│  대화가 끊이질 않아요."       │
│                             │
│ [ 이 취향으로 궁합 분석하기 ] │
└─────────────────────────────┘
```

---

## 6. 파일 변경 목록

| 파일 | 작업 | 내용 |
|------|------|------|
| `src/types/index.ts` | 수정 | `TasteType`, `TopCategory` 타입 추가. `MatchResult`에 선택 필드 5개 추가 |
| `src/lib/algorithm.ts` | 수정 | `classifyTasteType`, `calcDiversityIndex`, `getTopCategories`, `getFriendType`, `generateSoloComment` 함수 추가 |
| `src/app/api/match/solo/route.ts` | 수정 | 신규 algorithm 함수 적용, 하드코딩 제거 |
| `src/app/result/[matchId]/page.tsx` | 수정 | `isSolo` 분기 → SoloResultView/기존 비교 UI |
| `src/components/result/SoloResultView.tsx` | 신규 | 솔로 결과 전체 레이아웃 |
| `src/components/result/TasteTypeBadge.tsx` | 신규 | 취향 유형 뱃지 카드 |
| `src/components/result/DiversityGauge.tsx` | 신규 | 집중도 게이지 |
| `src/components/result/FriendTypeCard.tsx` | 신규 | 친구 취향 카드 + CTA |

**수정 4개 / 신규 4개 / 총 8개 파일**

---

## 7. 구현 순서 (Session Guide)

### Module 1 — 타입 + 알고리즘 (기반)
1. `types/index.ts` 타입 확장
2. `algorithm.ts` 4개 함수 추가
3. `api/match/solo/route.ts` 수정

### Module 2 — UI 컴포넌트
4. `TasteTypeBadge.tsx` 생성
5. `DiversityGauge.tsx` 생성
6. `FriendTypeCard.tsx` 생성
7. `SoloResultView.tsx` 생성 (위 3개 조합)

### Module 3 — 결과 페이지 연결
8. `result/[matchId]/page.tsx` isSolo 분기 적용

---

## 8. 성공 기준 체크리스트

- [ ] `classifyTasteType` — 8개 유형 분기 정확히 동작
- [ ] `calcDiversityIndex` — 0~100 범위, HHI 공식 정확
- [ ] 솔로 결과에 "싱크로율", "공통 채널", "X × Y" 텍스트 미노출
- [ ] 취향 유형 뱃지 카드 렌더링 + 유형별 색상 적용
- [ ] 다양성 게이지 애니메이션 동작
- [ ] 친구 유형 카드 + 궁합 분석 CTA 버튼 작동
- [ ] 비교 분석 플로우 (/m/[matchId] → /result) 정상 동작 유지
