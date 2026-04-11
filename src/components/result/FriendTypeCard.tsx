"use client";
import type { TasteType } from "@/types";
import { TASTE_TYPE_META } from "@/types";
import { Button } from "@/components/ui/Button";

interface Props {
  friendType: TasteType;
  friendTypeReason: string;
  onStartMatch: () => void;
}

export function FriendTypeCard({ friendType, friendTypeReason, onStartMatch }: Props) {
  const meta = TASTE_TYPE_META[friendType];

  return (
    <div className="bg-white rounded-3xl p-6 border border-border">
      <h3 className="font-bold text-gray-900 mb-4">나와 잘 맞을 친구 취향</h3>
      <div
        className="rounded-2xl p-4 mb-4 flex items-center gap-3"
        style={{ backgroundColor: meta.bgColor }}
      >
        <span className="text-3xl">{meta.emoji}</span>
        <div>
          <p className="font-bold text-gray-900">{meta.label}</p>
          <p className="text-sm text-gray-600 mt-0.5">{friendTypeReason}</p>
        </div>
      </div>
      <Button variant="primary" fullWidth onClick={onStartMatch}>
        이 취향의 친구와 궁합 분석하기 →
      </Button>
    </div>
  );
}
