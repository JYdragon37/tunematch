"use client";
import { useEffect, useState } from "react";

interface CountUpScoreProps {
  target: number;
  duration?: number;
  className?: string;
}

export function CountUpScore({ target, duration = 2000, className = "" }: CountUpScoreProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCurrent(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span className={className}>{current}</span>;
}
