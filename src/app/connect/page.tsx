"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

const COLLECT_INFO = [
  { icon: "✅", text: "구독 채널 목록" },
  { icon: "✅", text: "좋아요 누른 영상" },
  { icon: "❌", text: "시청 기록 (수집 안 함)" },
  { icon: "❌", text: "개인정보 (수집 안 함)" },
];

export default function ConnectPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      // 기존 세션 초기화 → 항상 계정 선택창 + YouTube scope 동의 강제
      await signOut({ redirect: false });
      await signIn("google", { callbackUrl: "/connect/callback" });
    } catch {
      setError("연동 중 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 py-4">
        <Link href="/" className="text-text-secondary hover:text-text-primary text-sm flex items-center gap-1">
          ← 뒤로
        </Link>
      </div>

      <div className="max-w-md mx-auto px-5 pt-4 pb-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <span className="text-3xl">🎵</span>
          </div>
          <h1 className="text-2xl font-black text-text-primary">
            <span className="text-primary">TUNE</span>MATCH
          </h1>
        </div>

        <h2 className="text-xl font-bold text-text-primary text-center mb-6">
          내 유튜브 취향을 분석할게요
        </h2>

        <div className="bg-white rounded-3xl p-6 border border-border mb-6">
          <h3 className="font-semibold text-text-primary mb-4 text-sm">수집하는 정보</h3>
          <div className="space-y-3">
            {COLLECT_INFO.map((info, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{info.icon}</span>
                <span className={`text-sm ${info.icon === "❌" ? "text-text-muted line-through" : "text-text-primary font-medium"}`}>
                  {info.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-sm text-text-secondary leading-relaxed">
            분석 후 즉시 삭제되며<br />
            <strong>서버에 저장되지 않아요</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-sm text-red-600">
            {error}
          </div>
        )}

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

        <p className="text-xs text-text-muted text-center">
          연동하면{" "}
          <a href="#" className="underline hover:text-text-secondary">개인정보처리방침</a>에
          동의한 것으로 간주됩니다
        </p>
      </div>
    </main>
  );
}
