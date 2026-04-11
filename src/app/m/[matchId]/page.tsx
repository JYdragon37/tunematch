"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MOCK_USER_B } from "@/data/mock-channels";

interface MatchData {
  id: string;
  userAName: string;
  status: string;
  expiresAt: string;
}

const COLLECT_INFO = [
  { icon: "✅", text: "구독 채널" },
  { icon: "✅", text: "좋아요" },
  { icon: "❌", text: "시청기록" },
  { icon: "❌", text: "개인정보" },
];

export default function InvitePage({ params }: { params: { matchId: string } }) {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchMatchData();
  }, [params.matchId]);

  const fetchMatchData = async () => {
    try {
      const res = await fetch(`/api/match/${params.matchId}`);
      if (res.status === 410) {
        setError("만료된 링크입니다. (7일 경과)");
        return;
      }
      if (res.status === 409) {
        setError("이미 완료된 매칭입니다.");
        return;
      }
      if (!res.ok) {
        setError("링크를 찾을 수 없습니다.");
        return;
      }
      const data = await res.json();
      if (data.status === "done") {
        router.push(`/result/${params.matchId}`);
        return;
      }
      setMatchData(data);
    } catch {
      setError("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Mock: 실제 OAuth 없이 테스트 유저 B로 진행
      const res = await fetch(`/api/match/${params.matchId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: MOCK_USER_B.id,
          userName: MOCK_USER_B.name,
          accessToken: "mock-youtube-access-token-b",
        }),
      });

      if (!res.ok) throw new Error("연동 실패");

      router.push(`/result/${params.matchId}`);
    } catch {
      alert("연동 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">😔</div>
          <h1 className="text-xl font-bold text-text-primary mb-2">{error}</h1>
          <p className="text-text-secondary text-sm mb-6">새로운 궁합 분석을 시작해보세요</p>
          <a href="/" className="inline-block">
            <Button variant="primary">TuneMatch 시작하기</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* 로고 */}
      <div className="max-w-md mx-auto px-5 py-4 text-center">
        <span className="font-black text-xl text-text-primary tracking-tight">
          <span className="text-primary">TUNE</span>MATCH
        </span>
      </div>

      <div className="max-w-md mx-auto px-5 pt-4 pb-20 space-y-6">
        {/* 초대장 헤더 */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-text-primary mb-1">
            {matchData?.userAName || "친구"}님이 보낸
          </h1>
          <p className="text-xl font-bold text-text-primary">궁합 분석 초대장 🎯</p>
        </div>

        {/* 흐릿한 점수 미리보기 */}
        <div className="bg-white rounded-3xl p-6 border border-border relative overflow-hidden">
          <div className="absolute inset-0 backdrop-blur-sm bg-white/50 flex items-center justify-center z-10 rounded-3xl">
            <div className="text-center">
              <span className="text-4xl font-black text-text-muted">???점</span>
              <p className="text-sm text-text-muted mt-1">연동하면 확인 가능</p>
            </div>
          </div>
          <div className="text-center py-4 blur-sm">
            <p className="text-text-secondary mb-2">{matchData?.userAName} × 친구</p>
            <p className="text-text-secondary text-sm">유튜브 취향 궁합은?</p>
            <div className="text-5xl font-black text-primary mt-2">--</div>
          </div>
        </div>

        {/* 안내 */}
        <div className="text-center">
          <p className="text-text-secondary">
            내 유튜브를 연동하면<br />
            <strong className="text-text-primary">바로 결과를 볼 수 있어요</strong>
          </p>
        </div>

        {/* 연동 버튼 */}
        <Button
          variant="google"
          size="lg"
          fullWidth
          onClick={handleConnect}
          loading={connecting}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google 계정으로 연동하기
        </Button>

        {/* 하단 수집 정보 요약 */}
        <div className="bg-muted rounded-2xl p-4">
          <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">수집 정보</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-text-secondary">
            {COLLECT_INFO.map((info, i) => (
              <div key={i} className="flex items-center gap-1">
                <span>{info.icon}</span>
                <span className={info.icon === "❌" ? "text-text-muted" : ""}>{info.text}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2">분석 후 즉시 삭제</p>
        </div>
      </div>
    </main>
  );
}
