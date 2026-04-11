"use client";
import { useEffect, useState } from "react";
import type { TasteType } from "@/types";
import { TASTE_TYPE_META } from "@/types";

interface Props {
  tasteType: TasteType;
  userName: string;
}

export function TasteTypeBadge({ tasteType, userName }: Props) {
  const [visible, setVisible] = useState(false);
  const meta = TASTE_TYPE_META[tasteType];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`rounded-3xl p-6 text-center transition-all duration-700 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      style={{ backgroundColor: meta.bgColor, border: `2px solid ${meta.color}20` }}
    >
      <div className="text-6xl mb-3">{meta.emoji}</div>
      <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: meta.color }}>
        {userName}의 유튜브 유형
      </div>
      <div className="text-2xl font-black text-gray-900 mb-3">{meta.label}</div>
      <p className="text-sm text-gray-600 leading-relaxed">{meta.description}</p>
      <div
        className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: meta.color, color: "white" }}
      >
        #{meta.label.replace("형", "")}
      </div>
    </div>
  );
}
