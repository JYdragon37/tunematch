"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { copyToClipboard, getMatchUrl } from "@/lib/utils";
import { shareKakao } from "@/lib/kakao";

function ShareContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const matchId = searchParams.get("matchId") || "";
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [soloLoading, setSoloLoading] = useState(false);

  const matchUrl = getMatchUrl(matchId);

  // 사용자 이름 추출 (이름 앞부분만)
  const userName = (session?.user?.name ?? "").split(" ")[0];
  const displayName = userName ? `${userName}님의` : "내";

  const handleCopy = async () => {
    await copyToClipboard(matchUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKakaoShare = () => {
    shareKakao({
      title: "내 유튜브 취향 궁합 분석해줘!",
      description: "30초만에 우리의 유튜브 취향이 얼마나 닮았는지 확인해봐요",
      linkUrl: matchUrl,
    });
  };

  const handleSmsShare = () => {
    const text = `[TuneMatch] 내 유튜브 취향 궁합 분석해줘! 링크: ${matchUrl}`;
    if (navigator.share) {
      navigator.share({ title: "TuneMatch", text, url: matchUrl });
    } else {
      window.open(`sms:?body=${encodeURIComponent(text)}`);
    }
  };

  // 혼자 분석하기
  const handleSoloAnalysis = async () => {
    setSoloLoading(true);
    try {
      const accessToken = (session as any)?.accessToken || "";
      const res = await fetch("/api/match/solo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, accessToken }),
      });
      if (!res.ok) throw new Error("분석 실패");
      router.push(`/result/${matchId}`);
    } catch {
      alert("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSoloLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* 상단 뒤로가기 */}
      <div className="max-w-md mx-auto px-5 py-4">
        <Link
          href="/connect"
          className="text-text-secondary hover:text-text-primary text-sm flex items-center gap-1"
        >
          ← 뒤로
        </Link>
      </div>

      <div className="max-w-md mx-auto px-5 pt-2 pb-20 space-y-5">
        {/* 완료 축하 영역 */}
        <div className="text-center pt-6 pb-4">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-black text-text-primary mb-2">연동 완료!</h1>
          <p className="text-base text-text-secondary leading-relaxed">
            {displayName} 유튜브 취향이 준비됐어요
          </p>
        </div>

        {/* PRIMARY CTA — 친구와 궁합 분석 */}
        <div className="bg-white rounded-3xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🎯</span>
            <h2 className="text-lg font-bold text-text-primary">친구와 궁합 분석하기</h2>
          </div>
          <p className="text-sm text-text-secondary mb-5 pl-8">
            링크를 보내면 바로 시작해요
          </p>

          {/* 카카오톡 공유 — 핵심 버튼 */}
          <button
            onClick={handleKakaoShare}
            className="w-full bg-[#FEE500] text-[#1A1A1A] py-4 rounded-2xl font-bold text-base mb-3 flex items-center justify-center gap-2 hover:bg-[#F5DC00] transition-colors"
          >
            <span className="text-lg">💬</span>
            카카오톡으로 공유
          </button>

          {/* 링크 복사 — 보조 옵션 */}
          <button
            onClick={handleCopy}
            className="w-full text-sm font-semibold text-text-secondary hover:text-text-primary flex items-center justify-center gap-1.5 py-2 transition-colors"
          >
            {copied ? (
              <>
                <span className="text-green-600">✓</span>
                <span className="text-green-600">링크 복사됨</span>
              </>
            ) : (
              <>
                <span>🔗</span>
                <span>링크 복사하기</span>
              </>
            )}
          </button>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted font-medium">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* SECONDARY CTA — 혼자 분석 */}
        <div className="bg-gray-50 rounded-3xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔍</span>
            <h2 className="text-lg font-bold text-text-primary">나 혼자 먼저 분석하기</h2>
          </div>
          <p className="text-sm text-text-secondary mb-5 pl-8">
            취향 유형과 카테고리 DNA를 지금 바로 확인해요
          </p>

          <Button
            variant="secondary"
            fullWidth
            onClick={handleSoloAnalysis}
            loading={soloLoading}
          >
            내 취향 분석 시작
          </Button>
        </div>

        {/* 결과 확인 링크 — 조용하게 */}
        <div className="text-center pt-2 pb-4">
          <Link href={`/result/${matchId}`}>
            <span className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
              결과 페이지로 바로 가기 →
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-text-muted">로딩 중...</div>
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  );
}
