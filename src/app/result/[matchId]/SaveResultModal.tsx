"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { MOCK_USER_A } from "@/data/mock-channels";
import type { MatchResult } from "@/types";

interface Props {
  result: MatchResult;
  onClose: () => void;
  onNew: () => void;
}

const SAVE_BENEFITS = [
  { emoji: "📁", text: "과거 결과 모아보기" },
  { emoji: "📊", text: "3개월 후 재분석 비교" },
  { emoji: "👥", text: "여러 친구 결과 한눈에" },
];

export default function SaveResultModal({ result, onClose, onNew }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mock 모드: 실제 OAuth 없이 Mock User A로 저장
      const res = await fetch("/api/result/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: MOCK_USER_A.id,
          matchResultId: result.id,
        }),
      });

      if (res.ok) {
        setSaved(true);
      } else {
        alert("저장 중 오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md bg-background rounded-t-3xl px-5 pt-6 pb-10 animate-slide-up">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-text-primary">결과 저장하기</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">✕</button>
        </div>

        {saved ? (
          /* 저장 완료 상태 */
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-text-primary mb-2">저장 완료!</h3>
            <p className="text-text-secondary text-sm mb-6">나중에 언제든지 확인할 수 있어요</p>
            <div className="bg-muted rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">{result.userAName} × {result.userBName}</span>
                <span className="font-bold text-primary">{result.totalScore}점</span>
              </div>
              <p className="text-xs text-text-muted mt-1">{formatDate(result.createdAt)}</p>
            </div>
            <Button variant="primary" fullWidth onClick={onNew}>
              다른 친구와도 해보기
            </Button>
          </div>
        ) : (
          /* 저장 유도 */
          <>
            <p className="text-text-secondary mb-4 leading-relaxed">
              결과를 저장하면<br />
              <strong className="text-text-primary">나중에도 볼 수 있어요 💾</strong>
            </p>

            <div className="bg-muted rounded-2xl p-4 mb-6">
              <p className="text-sm font-semibold text-text-secondary mb-3">저장하면 이런 게 가능해요</p>
              <div className="space-y-2">
                {SAVE_BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-text-primary">
                    <span className="text-xl">{b.emoji}</span>
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 결과 미리보기 */}
            <div className="bg-white rounded-2xl p-4 border border-border mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-text-primary text-sm">
                    {result.userAName} × {result.userBName}
                  </p>
                  <p className="text-xs text-text-muted">{formatDate(result.createdAt)}</p>
                </div>
                <span className="text-2xl font-black text-primary">{result.totalScore}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="google"
                fullWidth
                size="lg"
                onClick={handleSave}
                loading={saving}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google 계정으로 저장하기
              </Button>
              <Button variant="ghost" fullWidth onClick={onClose}>
                저장 없이 종료하기
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
