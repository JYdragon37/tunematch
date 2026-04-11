"use client";
import { useEffect, useState } from "react";

interface Props {
  diversityIndex: number; // 0~100
}

export function DiversityGauge({ diversityIndex }: Props) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(diversityIndex), 300);
    return () => clearTimeout(t);
  }, [diversityIndex]);

  const label =
    diversityIndex >= 66 ? "다양형" : diversityIndex >= 36 ? "균형형" : "집중형";
  const description =
    diversityIndex >= 66
      ? "모든 것에 열려있는 취향 콜렉터예요"
      : diversityIndex >= 36
      ? "여러 장르를 골고루 즐기는 타입이에요"
      : "취향이 뚜렷한 전문가 타입이에요";

  const color =
    diversityIndex >= 66 ? "#8B5CF6" : diversityIndex >= 36 ? "#10B981" : "#FF4D00";

  return (
    <div className="bg-white rounded-3xl p-6 border border-border">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-900">취향 집중도</h3>
        <span className="text-sm font-bold" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        <span>집중형</span>
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${width}%`, backgroundColor: color }}
          />
        </div>
        <span>다양형</span>
      </div>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
    </div>
  );
}
