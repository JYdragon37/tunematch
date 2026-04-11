"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { MatchResult } from "@/types";
import { SoloResultView } from "@/components/result/SoloResultView";

export default function BSoloPage({ params }: { params: { matchId: string } }) {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [userAName, setUserAName] = useState("");
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false); // 전체 분석 진행 중
  const [comparing, setComparing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    loadSoloResult();
  }, [params.matchId]);

  const loadSoloResult = async () => {
    // 1. sessionStorage에서 기본 결과 즉시 표시
    try {
      const stored = sessionStorage.getItem(`solo_${params.matchId}`);
      if (stored) {
        const { result: r, userAName: aName } = JSON.parse(stored);
        setResult(r);
        setUserAName(aName || "");
        setLoading(false);
        // B의 이름은 result.userAName (aName은 A의 이름)
        const hasFullData = !!(r?.channelStatsData);
        if (!hasFullData) triggerFullAnalysis(r?.userAName || "");
        return;
      }
    } catch {}

    // 2. DB에서 기존 결과 조회
    try {
      const res = await fetch(`/api/match/${params.matchId}/b-solo`);
      if (!res.ok) {
        router.push(`/m/${params.matchId}`);
        return;
      }
      const data = await res.json();
      const hasFullData = !!(data.result?.channelStatsData);
      setResult(data.result);
      setUserAName(data.userAName || "");  // A의 이름 (버튼용)
      setLoading(false);
      if (!hasFullData) {
        // B의 이름은 data.result.userAName
        triggerFullAnalysis(data.result?.userAName || "");
      }
    } catch {
      setLoadError("결과를 불러올 수 없어요. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  // 백그라운드에서 전체 분석 실행 (채널통계 + 좋아요)
  const triggerFullAnalysis = async (aName: string) => {
    const accessToken = (session as any)?.accessToken || "";
    if (!accessToken) return; // 토큰 없으면 기본 분석으로 유지

    setEnriching(true);
    try {
      const res = await fetch(`/api/match/${params.matchId}/b-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, userName: aName }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.soloResult);
        if (data.userAName) setUserAName(data.userAName);
        // sessionStorage 업데이트
        sessionStorage.setItem(`solo_${params.matchId}`, JSON.stringify({
          result: data.soloResult,
          userAName: data.userAName || aName,
        }));
      }
    } catch {
      // 전체 분석 실패해도 기본 결과는 유지
    } finally {
      setEnriching(false);
    }
  };

  const handleCompare = async () => {
    setComparing(true);
    setCompareError(null);
    try {
      const res = await fetch(`/api/match/${params.matchId}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "비교 실패" }));
        if (res.status === 409) {
          sessionStorage.removeItem(`solo_${params.matchId}`);
          router.push(`/result/${params.matchId}`);
          return;
        }
        const detail = err.detail ? ` (${err.detail})` : "";
        throw new Error(`${err.error || "비교 실패"}${detail}`);
      }

      sessionStorage.removeItem(`solo_${params.matchId}`);
      sessionStorage.setItem(`comparing_${params.matchId}`, "true");
      router.push(`/result/${params.matchId}`);
    } catch (e: any) {
      setCompareError(e.message || "비교 중 오류가 발생했습니다. 다시 시도해주세요.");
      setComparing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary text-sm">취향 분석 결과 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-4xl mb-4">😔</div>
          <p className="font-semibold text-text-primary mb-2">{loadError}</p>
          <button
            onClick={() => router.push(`/m/${params.matchId}`)}
            className="text-sm text-primary underline"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 py-4 text-center">
        <span className="font-black text-xl text-text-primary tracking-tight">
          <span className="text-primary">TUNE</span>MATCH
        </span>
      </div>

      <div className="max-w-md mx-auto px-5 pb-32">
        {/* 안내 배너 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 text-center">
          <p className="text-sm font-bold text-blue-800">내 유튜브 취향 분석 완료!</p>
          <p className="text-xs text-blue-600 mt-0.5">
            아래에서 확인한 후 <strong>{userAName || "친구"}님</strong>과 궁합을 비교해보세요
          </p>
        </div>

        {/* 심화 분석 로딩 중 배너 */}
        {enriching && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-xs text-amber-700">구독 기록관 상세 데이터 분석 중...</p>
          </div>
        )}

        <SoloResultView result={result} hideInvite />

        {/* 궁합 비교 버튼 */}
        <div className="mt-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-6 border border-primary/20">
          <div className="text-center mb-4">
            <p className="text-2xl mb-2">🎯</p>
            <h3 className="font-black text-gray-900 text-lg">
              {userAName || "친구"}님과 궁합 비교하기
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              두 사람의 취향 싱크로율과 공통 채널을 확인해요
            </p>
          </div>

          {compareError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 text-center">
              <p className="text-xs font-semibold text-red-700">{compareError}</p>
              <p className="text-xs text-red-500 mt-0.5">아래 버튼을 다시 눌러주세요</p>
            </div>
          )}

          <button
            onClick={handleCompare}
            disabled={comparing}
            className="w-full py-4 rounded-2xl bg-primary text-white font-black text-base flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {comparing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                궁합 분석 중...
              </>
            ) : (
              `🎵 ${userAName || "친구"}님과 궁합 확인하기`
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
