import { cn } from "@/lib/utils";
import type { MatchResult, CardStyle } from "@/types";

interface ShareCardProps {
  result: MatchResult;
  style: CardStyle;
  className?: string;
}

const STYLE_CONFIG = {
  dark: {
    bg: "bg-gray-900",
    text: "text-white",
    subtitle: "text-gray-400",
    accent: "text-primary",
    border: "border-gray-700",
  },
  light: {
    bg: "bg-white",
    text: "text-gray-900",
    subtitle: "text-gray-500",
    accent: "text-primary",
    border: "border-gray-200",
  },
  color: {
    bg: "bg-primary",
    text: "text-white",
    subtitle: "text-orange-100",
    accent: "text-yellow-300",
    border: "border-orange-400",
  },
};

export function ShareCard({ result, style, className }: ShareCardProps) {
  const config = STYLE_CONFIG[style];

  return (
    <div className={cn("rounded-3xl p-6 border", config.bg, config.border, className)}>
      <div className={cn("text-sm font-bold tracking-widest mb-4", config.accent)}>
        TUNEMATCH
      </div>
      <div className={cn("text-lg font-semibold mb-1", config.text)}>
        {result.userAName} × {result.userBName}
      </div>
      <div className={cn("text-5xl font-black my-4", config.accent)}>
        {result.totalScore}
      </div>
      <div className={cn("text-sm mb-4", config.subtitle)}>취향 싱크로율</div>
      <p className={cn("text-xs leading-relaxed mb-4", config.subtitle)}>
        "{result.comment}"
      </p>
      {/* 카테고리 미니 바 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {["지식", "엔터", "유머", "음악"].map((cat, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={config.subtitle}>{cat}</span>
            <div className="flex-1 h-1 bg-gray-600 rounded-full">
              <div
                className="h-full bg-orange-400 rounded-full"
                style={{ width: `${[60, 45, 70, 55][i]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className={cn("text-xs mt-4", config.subtitle)}>tunematch.com</div>
    </div>
  );
}
