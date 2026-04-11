# TuneMatch — 시작 전 준비 체크리스트
> Cursor / Claude Code에 넘기기 전에 직접 발급해야 하는 키 & 설정값  
> 예상 소요 시간: 40~50분

---

## STEP 1 · Google Cloud Console
> console.cloud.google.com · 약 15분

### 할 일
1. [Google Cloud Console](https://console.cloud.google.com) 접속 → 새 프로젝트 생성
2. API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성
3. API 라이브러리에서 **YouTube Data API v3** 검색 → 사용 설정
4. OAuth 동의 화면 → 범위 추가 → `youtube.readonly` 추가 (중요!)

### 발급 항목

| 변수명 | 설명 | 우선순위 |
|---|---|---|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 클라이언트 ID | 필수 |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 클라이언트 시크릿 | 필수 |
| YouTube Data API v3 | 키 발급 아님, 활성화만 | 필수 |

### 승인된 리디렉션 URI 등록
OAuth 클라이언트 설정에서 아래 두 개 추가:
```
http://localhost:3000/api/auth/callback/google
https://yourdomain.com/api/auth/callback/google
```

> ⚠️ `youtube.readonly` scope를 빠뜨리면 유튜브 데이터를 못 가져옴. OAuth 동의 화면에서 반드시 추가.

---

## STEP 2 · Supabase
> supabase.com · 약 10분 · 무료

### 할 일
1. [Supabase](https://supabase.com) 회원가입 → 새 프로젝트 생성
2. Settings → API 에서 키 복사

### 발급 항목

| 변수명 | 위치 | 우선순위 |
|---|---|---|
| `SUPABASE_URL` | Settings → API → Project URL | 필수 |
| `SUPABASE_ANON_KEY` | Settings → API → anon public | 필수 |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role | 필수 |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY`는 절대 `NEXT_PUBLIC_` 접두사 붙이지 말 것. 클라이언트에 노출되면 DB 전체가 뚫림.

---

## STEP 3 · NextAuth Secret
> 터미널에서 직접 생성 · 1분

터미널에서 아래 명령어 실행 후 나온 값을 그대로 사용:
```bash
openssl rand -base64 32
```

| 변수명 | 값 | 우선순위 |
|---|---|---|
| `NEXTAUTH_SECRET` | openssl 명령어 결과값 | 필수 |
| `NEXTAUTH_URL` | 개발: `http://localhost:3000` / 프로덕션: `https://yourdomain.com` | 필수 |

---

## STEP 4 · Resend (이메일 알림)
> resend.com · 약 5분 · 무료 3,000건/월

### 할 일
1. [Resend](https://resend.com) 회원가입
2. API Keys → Create API Key

| 변수명 | 설명 | 우선순위 |
|---|---|---|
| `RESEND_API_KEY` | API 키 (re_로 시작) | 필수 |
| `RESEND_FROM_EMAIL` | 무료 플랜: `onboarding@resend.dev` 사용 가능. 도메인 있으면 커스텀 설정. | 권장 |

---

## STEP 5 · 카카오 SDK (공유 기능)
> developers.kakao.com · 약 10분 · 무료

### 할 일
1. [카카오 개발자 콘솔](https://developers.kakao.com) → 앱 생성
2. 앱 키 → JavaScript 키 복사
3. 플랫폼 → Web → 사이트 도메인 등록 (`http://localhost:3000` 포함)

| 변수명 | 설명 | 우선순위 |
|---|---|---|
| `NEXT_PUBLIC_KAKAO_APP_KEY` | JavaScript 앱 키 | 필수 |

---

## STEP 6 · Vercel 배포
> vercel.com · 약 5분 · 무료

### 할 일
1. GitHub 레포 생성 후 Vercel 연결
2. Vercel 대시보드 → Settings → Environment Variables에 위 변수 전부 등록
3. (선택) 도메인 구매 후 연결 — MVP는 `vercel.app` 무료 도메인으로 시작 가능

| 항목 | 비용 |
|---|---|
| Vercel 호스팅 | 무료 |
| 도메인 | $10~15/년 (선택) |

---

## STEP 7 · Google AdSense
> adsense.google.com · 사이트 런치 후 신청

> MVP 개발 중엔 필요 없음. 사이트 배포 후 신청. 심사 1~2주 소요.

| 변수명 | 설명 | 우선순위 |
|---|---|---|
| `NEXT_PUBLIC_ADSENSE_ID` | 승인 후 Publisher ID (ca-pub-XXXX) | 나중에 |

---

## .env.local 템플릿

모든 키 발급 후 프로젝트 루트에 `.env.local` 파일 생성 후 붙여넣기:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=여기에_붙여넣기
GOOGLE_CLIENT_SECRET=여기에_붙여넣기

# NextAuth
NEXTAUTH_SECRET=openssl_rand_결과값
NEXTAUTH_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=여기에_붙여넣기
SUPABASE_SERVICE_ROLE_KEY=여기에_붙여넣기

# Resend (이메일)
RESEND_API_KEY=re_여기에_붙여넣기
RESEND_FROM_EMAIL=onboarding@resend.dev

# 카카오 공유
NEXT_PUBLIC_KAKAO_APP_KEY=여기에_붙여넣기

# AdSense (나중에)
NEXT_PUBLIC_ADSENSE_ID=ca-pub-나중에_추가
```

---

## Claude Code에 넘기는 방법

`.env.local` 다 채운 후 Claude Code에 아래처럼 입력:

```
이 .env.local 보고 TuneMatch 프로젝트 셋업해줘.
스펙 문서는 tunematch-dev-spec.docx 참고.

기술 스택:
- Next.js 14 (App Router)
- NextAuth v5 + Google OAuth (youtube.readonly scope)
- Supabase (PostgreSQL + Realtime)
- Tailwind CSS
- Recharts
- Satori + Sharp (공유 카드 이미지 생성)
- Resend (이메일)
- Vercel 배포

Day 1 Task부터 시작해줘:
1. Next.js 14 프로젝트 생성 + Tailwind + Supabase 셋업
2. 디자인 시스템 Tailwind config 설정 (Primary: #FF4D00, BG: #FAFAF8)
```

---

## 전체 산출물 목록

| 파일 | 내용 |
|---|---|
| `youtube-compatibility-planning.html` | 서비스 기획서 |
| `tunematch-wireframe.md` | 유저 저니 + 와이어프레임 |
| `tunematch-dev-spec.docx` | 개발 스펙 문서 (스프린트 플랜 포함) |
| `tunematch-setup-checklist.md` | 이 파일 |
