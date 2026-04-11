"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CountUpScore } from "@/components/ui/CountUpScore";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { RadarChartComponent } from "@/components/charts/RadarChart";
import { Button } from "@/components/ui/Button";
import { getScoreDetails } from "@/lib/algorithm";
import { getMatchUrl } from "@/lib/utils";
import type { MatchResult } from "@/types";
import ShareCardModal from "./ShareCardModal";
import SaveResultModal from "./SaveResultModal";
import { SoloResultView } from "@/components/result/SoloResultView";

const SCORE_COLOR_MAP: Record<string, string> = {
  channel: "#FF4D00",
  category: "#F59E0B",
  curiosity: "#10B981",
  humor: "#8B5CF6",
  pattern: "#3B82F6",
};

export default function ResultPage({ params }: { params: { matchId: string } }) {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(true);
  const [adShown, setAdShown] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const router = useRouter();
  const pollRef = useRef<NodeJS.Timeout>();

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
        setResult(data.result);
        setLoading(false);
        setTimeout(() => {
          setAnimating(false);
          setTimeout(() => setAdShown(true), 500);
        }, 3000);
      } else if (data.status === "solo_done" && data.result) {
        // 솔로 분석 완료, 친구 대기 중
        setResult(data.result);
        setLoading(false);
        pollRef.current = setTimeout(fetchResult, 3000);
      } else if (["waiting", "analyzing", "b_joined"].includes(data.status)) {
        pollRef.current = setTimeout(fetchResult, 3000);
        if (data.status === "b_joined") setLoading(false);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const handleCopyInvite = async () => {
    const url = getMatchUrl(params.matchId);
    await navigator.clipboard.writeText(url).catch(() => {});
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

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

  // ─── 결과 없음 ───
  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-xl font-bold text-text-primary mb-2">아직 친구가 연동하지 않았어요</h1>
          <p className="text-text-secondary text-sm mb-6">링크를 공유하고 기다려주세요</p>
          <Button onClick={() => router.back()} variant="secondary">돌아가기</Button>
        </div>
      </div>
    );
  }

  const isSolo = result.tasteType !== undefined;
  const scoreDetails = getScoreDetails(result);

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
      <div className="max-w-md mx-auto px-5 py-4 text-center">
        <span className="font-black text-xl text-text-primary tracking-tight">
          <span className="text-primary">TUNE</span>MATCH
        </span>
      </div>

      <div className="max-w-md mx-auto px-5 pb-32 space-y-6">
        <div className="text-center animate-fade-in">
          <p className="text-lg font-semibold text-text-primary">
            {result.userAName} × {result.userBName}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 text-center border border-border shadow-sm animate-fade-in">
          <div className="text-8xl font-black text-primary mb-2">
            <CountUpScore target={result.totalScore} duration={2000} />
          </div>
          <p className="text-text-secondary font-medium mb-4">취향 싱크로율</p>
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
            <span className="text-primary font-bold text-sm">{result.commentType}</span>
          </div>
          <p className="text-text-secondary text-sm mt-4 leading-relaxed">"{result.comment}"</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-border animate-fade-in-delay-1">
          <h2 className="font-bold text-text-primary mb-5">세부 항목</h2>
          {scoreDetails.map((detail, i) => (
            <ScoreBar
              key={detail.key}
              label={detail.label}
              score={detail.score}
              maxScore={detail.maxScore}
              delay={i * 100}
              color={SCORE_COLOR_MAP[detail.key]}
            />
          ))}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-border animate-fade-in-delay-2">
          <h2 className="font-bold text-text-primary mb-2">취향 DNA 비교</h2>
          <p className="text-xs text-text-muted mb-4">
            <span className="text-primary">●</span> {result.userAName}
            <span className="ml-3 text-blue-500">●</span> {result.userBName}
          </p>
          <RadarChartComponent
            vectorA={result.userAVector}
            vectorB={result.userBVector}
            nameA={result.userAName}
            nameB={result.userBName}
          />
        </div>

        {result.commonChannels.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-border animate-fade-in-delay-3">
            <h2 className="font-bold text-text-primary mb-4">
              공통 구독 채널 TOP {Math.min(result.commonChannels.length, 5)}
            </h2>
            <div className="space-y-3">
              {result.commonChannels.slice(0, 5).map((channel, i) => (
                <div key={channel.id} className="flex items-center gap-3">
                  <span className="text-text-muted text-sm w-5">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-text-muted">
                    {channel.title[0]}
                  </div>
                  <span className="text-text-primary text-sm font-medium">{channel.title}</span>
                  <span className="ml-auto text-xs text-text-muted bg-muted rounded-full px-2 py-0.5">
                    {channel.customCategory}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.recommendations.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-border animate-fade-in-delay-4">
            <h2 className="font-bold text-text-primary mb-4">📺 함께 볼 채널 추천</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {result.recommendations.map((channel) => (
                <div key={channel.id} className="shrink-0 w-28 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-2 text-xl font-bold text-primary">
                    {channel.title[0]}
                  </div>
                  <p className="text-xs text-text-primary font-medium leading-tight line-clamp-2">{channel.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{channel.customCategory}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {adShown && (
          <div className="bg-muted rounded-2xl p-4 text-center border border-border animate-fade-in">
            <p className="text-xs text-text-muted">[광고 영역]</p>
          </div>
        )}

        <div className="space-y-3 animate-fade-in-delay-5">
          <Button variant="primary" size="lg" fullWidth onClick={() => setShowShare(true)}>
            📤 결과 카드 공유하기
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setShowSave(true)}>
            💾 결과 저장하기
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => router.push("/connect")}>
            🔄 다른 친구와 해보기
          </Button>
        </div>
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
