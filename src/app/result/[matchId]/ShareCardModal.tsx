"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShareCard } from "@/components/cards/ShareCard";
import { copyToClipboard, getResultUrl } from "@/lib/utils";
import { shareKakao } from "@/lib/kakao";
import type { MatchResult, CardStyle } from "@/types";

interface Props {
  result: MatchResult;
  matchId: string;
  onClose: () => void;
}

const STYLES: { key: CardStyle; label: string; emoji: string }[] = [
  { key: "dark", label: "다크", emoji: "🌙" },
  { key: "light", label: "라이트", emoji: "☀️" },
  { key: "color", label: "컬러", emoji: "🎨" },
];

export default function ShareCardModal({ result, matchId, onClose }: Props) {
  const [cardStyle, setCardStyle] = useState<CardStyle>("dark");
  const [copied, setCopied] = useState(false);

  const resultUrl = getResultUrl(matchId);

  const handleKakaoShare = () => {
    shareKakao({
      title: `${result.userAName} × ${result.userBName} 취향 궁합 ${result.totalScore}점!`,
      description: result.comment,
      linkUrl: resultUrl,
    });
  };

  const handleImageSave = () => {
    // 실제 구현: html2canvas or /api/og 이미지 다운로드
    console.log("[Mock] 이미지 저장 시뮬레이션");
    alert("이미지 저장 기능은 실제 서버 연동 후 사용 가능합니다.\n\n현재 Mock 모드입니다.");
  };

  const handleLinkCopy = async () => {
    await copyToClipboard(resultUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 바텀시트 */}
      <div className="relative w-full max-w-md bg-background rounded-t-3xl px-5 pt-6 pb-10 animate-slide-up">
        {/* 핸들 */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-text-primary">결과 카드 만들기</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">✕</button>
        </div>

        {/* 카드 미리보기 */}
        <div className="mb-6">
          <p className="text-xs text-text-muted mb-3 uppercase tracking-wide">카드 미리보기</p>
          <ShareCard result={result} style={cardStyle} />
        </div>

        {/* 스타일 선택 */}
        <div className="mb-6">
          <p className="text-xs text-text-muted mb-3 uppercase tracking-wide">카드 스타일 선택</p>
          <div className="flex gap-3">
            {STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setCardStyle(s.key)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                  cardStyle === s.key
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-text-secondary hover:border-text-muted"
                }`}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 공유 버튼들 */}
        <div className="space-y-3">
          <Button
            fullWidth
            onClick={handleKakaoShare}
            className="bg-[#FEE500] text-[#1A1A1A] hover:bg-[#F5DC00] rounded-2xl font-semibold"
          >
            💬 카카오톡으로 공유
          </Button>
          <Button variant="secondary" fullWidth onClick={handleImageSave}>
            📸 이미지로 저장
          </Button>
          <Button variant="ghost" fullWidth onClick={handleLinkCopy}>
            {copied ? "✓ 링크 복사됨" : "🔗 링크 복사"}
          </Button>
        </div>
      </div>
    </div>
  );
}
