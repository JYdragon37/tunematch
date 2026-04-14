"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function ConnectPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      // auth.ts의 prompt: "select_account consent"로 매번 계정 선택 + 동의 강제
      await signIn("google", { callbackUrl: "/connect/callback" });
    } catch {
      setError("연동 중 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* 상단 뒤로가기 */}
      <div className="max-w-md mx-auto px-5 py-4">
        <Link
          href="/"
          className="text-text-secondary hover:text-text-primary text-sm flex items-center gap-1"
        >
          ← 뒤로
        </Link>
      </div>

      <div className="max-w-md mx-auto px-5 pt-2 pb-20">
        {/* 히어로 영역 */}
        <div className="text-center pt-6 pb-10">
          <div className="text-6xl mb-5">🎬</div>
          <h1 className="text-2xl font-black text-text-primary mb-3 leading-tight">
            유튜브 취향 분석
          </h1>
          <p className="text-base text-text-secondary leading-relaxed">
            내 구독 기록으로<br />
            취향 유형을 발견해요
          </p>
        </div>

        {/* 이것만 가져가요 */}
        <div className="bg-white rounded-3xl p-6 border border-border mb-4">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">
            이것만 가져가요
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold">✓</span>
              <span className="text-sm font-semibold text-text-primary">구독 채널 목록</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold">✓</span>
              <span className="text-sm font-semibold text-text-primary">좋아요 누른 영상</span>
            </div>
          </div>
        </div>

        {/* 이건 절대 안 봐요 */}
        <div className="bg-gray-50 rounded-3xl p-5 border border-border mb-5">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
            이건 절대 안 봐요
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-400 text-xs font-bold">✕</span>
              <span className="text-sm text-text-muted">시청 기록</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-400 text-xs font-bold">✕</span>
              <span className="text-sm text-text-muted">댓글 · 개인정보</span>
            </div>
          </div>
        </div>

        {/* 보안 뱃지 */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full px-3 py-1.5">
            🔒 분석 후 즉시 삭제 · 서버에 저장 안 해요
          </span>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Google CTA 버튼 */}
        <Button
          variant="google"
          size="lg"
          fullWidth
          onClick={handleGoogleConnect}
          loading={loading}
          className="mb-4"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google 계정으로 연동하기
        </Button>

        {/* 개인정보 안내 */}
        <p className="text-xs text-text-muted text-center">
          연동하면{" "}
          <a href="/privacy" className="underline hover:text-text-secondary">
            개인정보처리방침
          </a>
          에 동의한 것으로 간주됩니다
        </p>
      </div>
    </main>
  );
}
