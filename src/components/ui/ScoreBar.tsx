"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore: number;
  delay?: number;
  color?: string;
}

export function ScoreBar({ label, score, maxScore, delay = 0, color = "#FF4D00" }: ScoreBarProps) {
  const [width, setWidth] = useState(0);
  const percentage = Math.round((score / maxScore) * 100);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), 100 + delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <span className="text-sm font-bold text-text-primary">{percentage}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}
