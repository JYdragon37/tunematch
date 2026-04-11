"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { copyToClipboard, getMatchUrl } from "@/lib/utils";
import { shareKakao } from "@/lib/kakao";

function ShareContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId") || "";
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("jieun.kim@gmail.com"); // Mock: Google 계정 이메일 자동 입력
  const [emailSaved, setEmailSaved] = useState(false);

  const matchUrl = getMatchUrl(matchId);

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

  const handleEmailSave = async () => {
    // TODO: 이메일 업데이트 API 호출
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2000);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* 상단 네비 */}
      <div className="max-w-md mx-auto px-5 py-4">
        <Link href="/connect" className="text-text-secondary hover:text-text-primary text-sm flex items-center gap-1">
          ← 뒤로
        </Link>
      </div>

      <div className="max-w-md mx-auto px-5 pt-4 pb-20 space-y-6">
        {/* 완료 메시지 */}
        <div className="text-center py-4">
          <div className="text-4xl mb-3">✅</div>
          <h1 className="text-2xl font-black text-text-primary mb-2">내 연동 완료!</h1>
          <p className="text-text-secondary">이제 상대방에게 링크를 보내세요</p>
        </div>

        {/* 링크 공유 박스 */}
        <div className="bg-white rounded-3xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg">🔗</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{matchUrl}</p>
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
            >
              {copied ? "✓ 복사됨" : "복사"}
            </button>
          </div>

          {/* 공유 버튼들 */}
          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={handleKakaoShare}
              className="bg-[#FEE500] text-[#1A1A1A] hover:bg-[#F5DC00] rounded-2xl"
            >
              💬 카카오톡으로 공유
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={handleSmsShare}
            >
              📱 문자로 공유
            </Button>
          </div>
        </div>

        {/* 이메일 알림 설정 */}
        <div className="bg-white rounded-3xl p-6 border border-border">
          <p className="text-sm text-text-secondary mb-4 leading-relaxed">
            상대방이 연동하면<br />
            <strong className="text-text-primary">이메일로 알려드릴게요</strong>
          </p>

          <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">
            📧 알림 받을 이메일
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="이메일 입력"
            />
            <button
              onClick={handleEmailSave}
              className="px-4 py-3 rounded-xl bg-muted text-sm font-medium text-text-secondary hover:bg-border transition-colors"
            >
              {emailSaved ? "✓" : "저장"}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-2">(변경 가능)</p>
        </div>

        {/* 이탈 허용 버튼 */}
        <div className="text-center">
          <Link href="/">
            <button className="text-sm text-text-muted hover:text-text-secondary underline">
              대기 중... 나중에 올게요
            </button>
          </Link>
        </div>

        {/* 안내 */}
        <div className="bg-muted rounded-2xl p-4 text-center">
          <p className="text-xs text-text-secondary">
            상대방이 연동 완료하면 자동으로 결과 페이지로 이동해요
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-text-muted">로딩 중...</div>
    </div>}>
      <ShareContent />
    </Suspense>
  );
}
