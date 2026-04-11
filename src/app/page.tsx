"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const SAMPLE_REVIEWS = [
  { text: "남친이랑 해봤는데 충격적... 아무것도 안 겹침 ㅋㅋ", author: "지수님" },
  { text: "팀 온보딩에 써봤어요. 팀원들이랑 많이 친해진 것 같아요", author: "준혁님" },
  { text: "친구랑 86점 나왔는데 진짜 우리 찐친이 맞네요", author: "혜린님" },
];

const HOW_IT_WORKS = [
  { emoji: "1️⃣", text: "내 유튜브 연동" },
  { emoji: "2️⃣", text: "친구에게 링크 전송" },
  { emoji: "3️⃣", text: "친구도 연동" },
  { emoji: "4️⃣", text: "궁합 점수 확인!" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="flex justify-between items-center px-5 py-4 max-w-md mx-auto">
        <span className="font-black text-xl text-text-primary tracking-tight">
          <span className="text-primary">TUNE</span>MATCH
        </span>
        <span className="text-xs text-text-muted border border-border rounded-full px-3 py-1">KR</span>
      </header>

      <div className="max-w-md mx-auto px-5 pb-20 space-y-10">
        {/* Hero */}
        <section className="pt-8 pb-4 text-center">
          <h1 className="text-3xl font-black text-text-primary leading-tight mb-3">
            당신과 친구의<br />
            <span className="text-primary">유튜브 취향</span>은<br />
            얼마나 닮았을까?
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Google 계정 연동만으로 30초 완료
          </p>
          <Link href="/connect">
            <Button variant="primary" size="lg" fullWidth className="rounded-2xl shadow-lg">
              🔴 궁합 분석 시작하기
            </Button>
          </Link>
        </section>

        {/* 작동 방식 */}
        <section className="bg-white rounded-3xl p-6 border border-border">
          <h2 className="font-bold text-text-primary mb-4 text-sm uppercase tracking-wide">
            어떻게 작동하나요?
          </h2>
          <div className="space-y-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-2xl">{step.emoji}</span>
                <span className="text-text-primary font-medium">{step.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 샘플 결과 미리보기 */}
        <section>
          <h2 className="font-bold text-text-primary mb-3 text-sm uppercase tracking-wide">
            📊 샘플 결과 미리보기
          </h2>
          <div className="relative overflow-hidden rounded-3xl bg-white border border-border p-6">
            {/* 블러 오버레이 */}
            <div className="absolute inset-0 backdrop-blur-[2px] bg-white/60 flex flex-col items-center justify-center z-10 rounded-3xl">
              <p className="font-semibold text-text-primary mb-3">결과가 여기 표시돼요!</p>
              <Link href="/connect">
                <Button variant="primary" size="sm">내 결과 보러가기</Button>
              </Link>
            </div>
            {/* 블러 뒤 더미 콘텐츠 */}
            <div className="text-center">
              <div className="text-6xl font-black text-primary mb-2">83</div>
              <div className="text-sm text-text-secondary">취향 싱크로율</div>
              <div className="mt-4 space-y-2">
                {["채널 겹침", "카테고리 취향", "유머 코드"].map((item) => (
                  <div key={item} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{item}</span>
                    <span className="font-bold">██</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 후기 */}
        <section>
          <h2 className="font-bold text-text-primary mb-3 text-sm uppercase tracking-wide">
            💬 실제 후기
          </h2>
          <div className="space-y-3">
            {SAMPLE_REVIEWS.map((review, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-border">
                <p className="text-text-primary text-sm">"{review.text}"</p>
                <p className="text-text-muted text-xs mt-2">— {review.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 다시 CTA */}
        <section className="text-center">
          <Link href="/connect">
            <Button variant="primary" size="lg" fullWidth className="rounded-2xl">
              🔴 지금 시작하기
            </Button>
          </Link>
        </section>
      </div>

      {/* 푸터 */}
      <footer className="text-center text-xs text-text-muted py-8 border-t border-border">
        <div className="flex justify-center gap-4">
          <span>© 2025 TuneMatch</span>
          <span>·</span>
          <a href="#" className="hover:text-text-secondary">개인정보처리방침</a>
        </div>
      </footer>
    </main>
  );
}
