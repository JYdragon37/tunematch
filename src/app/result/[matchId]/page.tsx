"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CountUpScore } from "@/components/ui/CountUpScore";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { RadarChartComponent } from "@/components/charts/RadarChart";
import { Button } from "@/components/ui/Button";
import { getScoreDetails } from "@/lib/algorithm";
import type { MatchResult } from "@/types";
import ShareCardModal from "./ShareCardModal";
import SaveResultModal from "./SaveResultModal";

const SCORE_COLOR_MAP: Record<string, string> = {
  channel: "#FF4D00",
  category: "#F59E0B",
  curiosity: "#10B981",
  humor: "#8B5CF6",
  pattern: "#3B82F6",
};

export default function ResultPage({ params }: { params: { matchId: string } }) {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(true);
  const [adShown, setAdShown] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSave, setShowSave] = useState(false);
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

      if (data.status === "done" && data.result) {
        setResult(data.result);
        setLoading(false);
        // 애니메이션 후 광고 표시
        setTimeout(() => {
          setAnimating(false);
          setTimeout(() => setAdShown(true), 500);
        }, 3000);
      } else if (data.status === "waiting" || data.status === "analyzing") {
        // 폴링 (실제로는 Supabase Realtime 사용)
        pollRef.current = setTimeout(fetchResult, 2000);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-5">
          <div className="animate-spin w-12 h-12 border-3 border-primary border-t-transparent rounded-full mx-auto mb-6" />
          <h1 className="text-xl font-bold text-text-primary mb-2">취향 분석 중...</h1>
          <p className="text-text-secondary text-sm">두 사람의 유튜브 DNA를 비교하고 있어요</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-xl font-bold text-text-primary mb-2">아직 상대방이 연동하지 않았어요</h1>
          <p className="text-text-secondary text-sm mb-6">링크를 공유하고 기다려주세요</p>
          <Button onClick={() => router.back()} variant="secondary">돌아가기</Button>
        </div>
      </div>
    );
  }

  const scoreDetails = getScoreDetails(result);

  return (
    <main className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="max-w-md mx-auto px-5 py-4 text-center">
        <span className="font-black text-xl text-text-primary tracking-tight">
          <span className="text-primary">TUNE</span>MATCH
        </span>
      </div>

      <div className="max-w-md mx-auto px-5 pb-32 space-y-6">
        {/* 이름 */}
        <div className="text-center animate-fade-in">
          <p className="text-lg font-semibold text-text-primary">
            {result.userAName} × {result.userBName}
          </p>
        </div>

        {/* 메인 점수 카드 */}
        <div className="bg-white rounded-3xl p-8 text-center border border-border shadow-sm animate-fade-in">
          <div className="text-8xl font-black text-primary mb-2 animate-count-up">
            <CountUpScore target={result.totalScore} duration={2000} />
          </div>
          <p className="text-text-secondary font-medium mb-4">취향 싱크로율</p>
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
            <span className="text-primary font-bold text-sm">{result.commentType}</span>
          </div>
          <p className="text-text-secondary text-sm mt-4 leading-relaxed">
            "{result.comment}"
          </p>
        </div>

        {/* 세부 항목 */}
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

        {/* 취향 DNA 레이더 차트 */}
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

        {/* 공통 구독 채널 */}
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

        {/* 추천 채널 */}
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

        {/* 광고 영역 (결과 확인 후 1회만) */}
        {adShown && (
          <div className="bg-muted rounded-2xl p-4 text-center border border-border animate-fade-in">
            <p className="text-xs text-text-muted">[광고 영역]</p>
            <p className="text-xs text-text-muted">AdSense 승인 후 광고가 표시됩니다</p>
          </div>
        )}

        {/* CTA 버튼들 */}
        <div className="space-y-3 animate-fade-in-delay-5">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setShowShare(true)}
          >
            📤 결과 카드 공유하기
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => setShowSave(true)}
          >
            💾 결과 저장하기
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => router.push("/connect")}
          >
            🔄 다른 친구와 해보기
          </Button>
        </div>
      </div>

      {/* 공유 카드 모달 */}
      {showShare && result && (
        <ShareCardModal
          result={result}
          matchId={params.matchId}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* 결과 저장 모달 */}
      {showSave && result && (
        <SaveResultModal
          result={result}
          onClose={() => setShowSave(false)}
          onNew={() => router.push("/connect")}
        />
      )}
    </main>
  );
}
