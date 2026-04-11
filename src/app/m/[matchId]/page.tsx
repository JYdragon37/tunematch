"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

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
  const [expired, setExpired] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetchMatchData();
  }, [params.matchId]);

  // 세션 있으면 자동으로 join
  useEffect(() => {
    if (status === "authenticated" && session && matchData && matchData.status === "waiting") {
      handleJoin();
    }
    if (status === "authenticated" && session && matchData && matchData.status === "b_joined") {
      // 이미 B가 join했으면 solo 페이지로
      router.push(`/m/${params.matchId}/solo`);
    }
  }, [status, session, matchData]);

  const fetchMatchData = async () => {
    try {
      const res = await fetch(`/api/match/${params.matchId}`);
      if (res.status === 410) {
        setExpired(true);
        return;
      }
      if (!res.ok) { setError("링크를 찾을 수 없습니다."); return; }
      const data = await res.json();
      if (data.status === "done") { router.push(`/result/${params.matchId}`); return; }
      setMatchData(data);
    } catch {
      setError("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!session) return;
    setConnecting(true);
    try {
      const accessToken = (session as any)?.accessToken || "";
      const res = await fetch(`/api/match/${params.matchId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session as any)?.googleId || session?.user?.email,
          userName: session?.user?.name || "사용자B",
          accessToken,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        const detail = err.detail ? ` (${err.detail})` : "";
        throw new Error(`${err.error || "연동 실패"}${detail}`);
      }

      const data = await res.json();
      // B 솔로 결과를 sessionStorage에 저장 후 solo 페이지로 이동
      if (data.soloResult) {
        sessionStorage.setItem(`solo_${params.matchId}`, JSON.stringify({
          result: data.soloResult,
          userAName: data.userAName,
        }));
      }
      router.push(`/m/${params.matchId}/solo`);
    } catch (e: any) {
      setError(e.message || "연동 중 오류가 발생했습니다. 다시 시도해주세요.");
      setConnecting(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    if (status === "authenticated") {
      await handleJoin();
    } else {
      await signIn("google", { callbackUrl: `/m/${params.matchId}` });
    }
  };

  if (loading || (status === "authenticated" && connecting)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary text-sm">
            {connecting ? "취향 분석 중... (잠시 기다려주세요)" : "로딩 중..."}
          </p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-text-primary mb-2">분석 링크가 만료됐어요</h1>
          <p className="text-text-secondary text-sm mb-2">
            링크는 생성 후 <strong>24시간</strong>만 유효합니다.
          </p>
          <p className="text-text-secondary text-sm mb-6">
            친구에게 새 링크를 다시 보내달라고 해주세요.
          </p>
          <a href="/"><Button variant="primary">TuneMatch 시작하기</Button></a>
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
          <a href="/"><Button variant="primary">TuneMatch 시작하기</Button></a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 py-4 text-center">
        <span className="font-black text-xl text-text-primary tracking-tight">
          <span className="text-primary">TUNE</span>MATCH
        </span>
      </div>

      <div className="max-w-md mx-auto px-5 pt-4 pb-20 space-y-6">
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
            <div className="text-5xl font-black text-primary mt-2">--</div>
          </div>
        </div>

        {/* 플로우 안내 */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-primary mb-2">연동하면 이렇게 진행돼요</p>
          {[
            "① 내 유튜브 취향 분석 먼저 확인",
            `② ${matchData?.userAName || "친구"}님과 궁합 비교`,
            "③ 취향 싱크로율 + 공통 채널 공개",
          ].map((step, i) => (
            <p key={i} className="text-xs text-gray-600">{step}</p>
          ))}
        </div>

        <Button variant="google" size="lg" fullWidth onClick={handleConnect} loading={connecting}>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 내 취향 분석하기
        </Button>

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
