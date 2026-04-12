"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getMatchUrl } from "@/lib/utils";
import type { MatchResult } from "@/types";
import ShareCardModal from "./ShareCardModal";
import SaveResultModal from "./SaveResultModal";
import { SoloResultView } from "@/components/result/SoloResultView";
import { CompatibilityView } from "@/components/result/CompatibilityView";

function ResultPageContent({ params }: { params: { matchId: string } }) {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(true);
  const [adShown, setAdShown] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isComparingMode, setIsComparingMode] = useState(false);
  const [comparingTimedOut, setComparingTimedOut] = useState(false);
  const prevResultRef = useRef<MatchResult | null>(null);
  const isComparingRef = useRef(false);
  const router = useRouter();
  const pollRef = useRef<NodeJS.Timeout>();

  // sessionStorage에서 comparing 플래그 읽기
  useEffect(() => {
    const flag = sessionStorage.getItem(`comparing_${params.matchId}`);
    if (flag === "true") {
      setIsComparingMode(true);
      isComparingRef.current = true;
      // 15초 타임아웃: 너무 오래 걸리면 탈출 버튼 표시
      setTimeout(() => setComparingTimedOut(true), 15000);
    }
  }, [params.matchId]);

  useEffect(() => {
    fetchResult();
    return () => clearTimeout(pollRef.current);
  }, [params.matchId]);

  const fetchResult = async () => {
    try {
      const res = await fetch(`/api/match/${params.matchId}/result`);
      const data = await res.json();
      setSessionStatus(data.sessionStatus || data.status);

      if (data.status === "done" && data.result) {
        // comparing 모드(B가 방금 compare 후 이동): sessionStorage 정리 + 축하 표시
        if (isComparingRef.current) {
          sessionStorage.removeItem(`comparing_${params.matchId}`);
          setIsComparingMode(false);
          isComparingRef.current = false;
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 2500);
        }
        // A가 폴링 중 비교 완료 감지: 솔로→비교 전환 시 축하
        else if (prevResultRef.current?.tasteType && !data.result.tasteType) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 2500);
        }
        prevResultRef.current = data.result;
        setResult(data.result);
        setLoading(false);
        setTimeout(() => {
          setAnimating(false);
          setTimeout(() => setAdShown(true), 500);
        }, 3000);
      } else if (data.status === "solo_done" && data.result) {
        // A 솔로 완료, 친구 대기 중 (폴링 유지)
        prevResultRef.current = data.result;
        setResult(data.result);
        setLoading(false);
        pollRef.current = setTimeout(fetchResult, 3000);
      } else if (["waiting", "b_joined", "analyzing"].includes(data.status)) {
        // 솔로 없이 대기 중 OR B가 join했지만 아직 비교 안 함
        setLoading(false);
        pollRef.current = setTimeout(fetchResult, 3000);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
      // 에러 시에도 comparing 모드면 재시도
      if (isComparingRef.current) {
        pollRef.current = setTimeout(fetchResult, 3000);
      }
    }
  };

  const handleCopyInvite = async () => {
    const url = getMatchUrl(params.matchId);
    await navigator.clipboard.writeText(url).catch(() => {});
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  // ─── B가 compare 직후 이동한 경우 - 궁합 완성 전까지 전용 로딩 표시 ───
  if (isComparingMode && sessionStatus !== "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-5">
          <div className="text-5xl mb-5">🎯</div>
          <h1 className="text-2xl font-black text-text-primary mb-2">궁합 분석 중...</h1>
          <p className="text-text-secondary text-sm mb-6">두 사람의 유튜브 취향을 비교하고 있어요</p>
          <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full mx-auto mb-6" />
          {comparingTimedOut && (
            <button
              onClick={() => {
                clearTimeout(pollRef.current);
                sessionStorage.removeItem(`comparing_${params.matchId}`);
                setIsComparingMode(false);
                isComparingRef.current = false;
                setComparingTimedOut(false);
                setResult(null);
                setLoading(true);
                fetchResult();
              }}
              className="text-sm text-primary underline"
            >
              시간이 오래 걸리네요. 결과 확인하기 →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── 로딩 상태 ───
  if (loading && !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-5">
          <div className="animate-spin w-12 h-12 border-3 border-primary border-t-transparent rounded-full mx-auto mb-6" />
          <h1 className="text-xl font-bold text-text-primary mb-2">분석 중...</h1>
          <p className="text-text-secondary text-sm">취향 데이터를 불러오고 있어요</p>
        </div>
      </div>
    );
  }

  // ─── 친구가 비교 시작함, 결과 생성 중 ───
  if (sessionStatus === "b_joined" && !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-5">
          <div className="text-4xl mb-4">🎯</div>
          <h1 className="text-xl font-bold text-text-primary mb-2">친구가 취향 분석 중이에요</h1>
          <p className="text-text-secondary text-sm">잠시 후 궁합 결과를 볼 수 있어요</p>
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mt-6" />
        </div>
      </div>
    );
  }

  // ─── 솔로 없이 대기 중 ───
  if (!result) {
    const waitMsg =
      sessionStatus === "b_joined" ? "친구가 궁합 비교 버튼을 누르면 결과가 나와요" :
      sessionStatus === "analyzing" ? "궁합 분석 중이에요..." :
      "아직 친구가 연동하지 않았어요";
    const waitTitle =
      sessionStatus === "b_joined" ? "🎯 친구가 취향 분석 완료!" :
      sessionStatus === "analyzing" ? "⚙️ 분석 중..." :
      "⏳ 친구를 기다리는 중";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center max-w-xs">
          <h1 className="text-xl font-bold text-text-primary mb-2">{waitTitle}</h1>
          <p className="text-text-secondary text-sm mb-6">{waitMsg}</p>
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-6" />
          <button
            onClick={handleCopyInvite}
            className="text-sm font-semibold text-primary border border-primary/30 rounded-xl px-4 py-2 hover:bg-primary/5"
          >
            {inviteCopied ? "✓ 복사됨" : "🔗 초대 링크 복사"}
          </button>
        </div>
      </div>
    );
  }

  const isSolo = result.tasteType !== undefined;

  // ─── 솔로 분석 뷰 (친구 대기 배너 포함) ───
  if (isSolo) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-5 py-4 text-center">
          <span className="font-black text-xl text-text-primary tracking-tight">
            <span className="text-primary">TUNE</span>MATCH
          </span>
        </div>

        {/* 친구 대기 중 배너 */}
        {sessionStatus !== "done" && (
          <div className="max-w-md mx-auto px-5 mb-2">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-amber-800">
                  {sessionStatus === "b_joined" ? "🎯 친구가 분석 중이에요!" : "⏳ 친구를 기다리는 중..."}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {sessionStatus === "b_joined"
                    ? "곧 궁합 결과가 나와요"
                    : "링크를 보내면 바로 궁합 비교 가능"}
                </p>
              </div>
              {sessionStatus !== "b_joined" && (
                <button
                  onClick={handleCopyInvite}
                  className="shrink-0 text-xs font-bold text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 bg-white"
                >
                  {inviteCopied ? "✓" : "링크 복사"}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto px-5 pb-32">
          <SoloResultView result={result} hideInvite={sessionStatus !== "done"} />
        </div>
      </main>
    );
  }

  // ─── 궁합 비교 결과 뷰 ───
  return (
    <main className="min-h-screen bg-background">
      {showCelebration && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in">
          <div className="text-center px-8 py-10 bg-white rounded-3xl mx-5 shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">궁합 결과 완성!</h2>
            <p className="text-gray-500 text-sm">친구와의 취향 싱크로율이 나왔어요</p>
          </div>
        </div>
      )}
      <div className="max-w-md mx-auto px-5 py-4 text-center">
        <span className="font-black text-xl text-text-primary tracking-tight">
          <span className="text-primary">TUNE</span>MATCH
        </span>
      </div>
      <div className="max-w-md mx-auto px-5 pb-32">
        <CompatibilityView
          result={result}
          matchId={params.matchId}
          onShare={() => setShowShare(true)}
          onSave={() => setShowSave(true)}
        />
      </div>
      {showShare && result && (
        <ShareCardModal result={result} matchId={params.matchId} onClose={() => setShowShare(false)} />
      )}
      {showSave && result && (
        <SaveResultModal result={result} onClose={() => setShowSave(false)} onNew={() => router.push("/connect")} />
      )}
    </main>
  );
}

export default function ResultPage({ params }: { params: { matchId: string } }) {
  return <ResultPageContent params={params} />;
}
