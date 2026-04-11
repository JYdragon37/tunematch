"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ConnectCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/connect");
      return;
    }

    if (status === "authenticated" && session) {
      const accessToken = (session as any)?.accessToken;

      if (!accessToken) {
        // YouTube 토큰 없음 → 연동 페이지로 돌아가 에러 표시
        setError("YouTube 접근 권한을 받지 못했어요. 다시 시도해주세요.");
        setTimeout(() => router.push("/connect"), 2500);
        return;
      }

      // 토큰 정상 → 매칭 세션 생성
      fetch("/api/match/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session as any)?.googleId || session?.user?.email,
          userName: session?.user?.name || "사용자",
          email: session?.user?.email || "",
          accessToken,
        }),
      })
        .then((r) => r.json())
        .then(({ matchId }) => {
          if (matchId) router.push(`/share?matchId=${matchId}`);
          else throw new Error("matchId 없음");
        })
        .catch(() => {
          setError("분석 세션 생성에 실패했어요. 다시 시도해주세요.");
          setTimeout(() => router.push("/connect"), 2500);
        });
    }
  }, [status, session]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-text-primary font-semibold mb-2">{error}</p>
          <p className="text-text-muted text-sm">잠시 후 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-text-secondary text-sm">구독 채널 가져오는 중...</p>
      </div>
    </div>
  );
}
