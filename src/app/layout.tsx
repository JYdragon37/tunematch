import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuneMatch — 유튜브 취향 궁합 분석",
  description: "당신과 친구의 유튜브 취향은 얼마나 닮았을까? Google 계정 연동으로 30초만에 확인하세요.",
  keywords: ["유튜브", "취향", "궁합", "YouTube", "TuneMatch"],
  openGraph: {
    title: "TuneMatch — 유튜브 취향 궁합 분석",
    description: "당신과 친구의 유튜브 취향은 얼마나 닮았을까?",
    type: "website",
    locale: "ko_KR",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TuneMatch — 유튜브 취향 궁합 분석",
    description: "당신과 친구의 유튜브 취향은 얼마나 닮았을까?",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-background min-h-screen">
        {children}
      </body>
    </html>
  );
}
