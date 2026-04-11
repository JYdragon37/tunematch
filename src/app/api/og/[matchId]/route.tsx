import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const result = mockStore.getResultBySession(params.matchId);

  const score = result?.totalScore ?? 83;
  const nameA = result?.userAName ?? "사용자A";
  const nameB = result?.userBName ?? "사용자B";
  const comment = result?.comment ?? "취향이 잘 맞는 사이예요!";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1A1A1A 0%, #2D1100 100%)",
          padding: "60px",
        }}
      >
        <div style={{ color: "#FF4D00", fontSize: 32, fontWeight: "bold", marginBottom: 20 }}>
          TUNEMATCH
        </div>
        <div style={{ color: "white", fontSize: 28, marginBottom: 16 }}>
          {nameA} × {nameB}
        </div>
        <div style={{ fontSize: 96, fontWeight: "bold", color: "#FF4D00" }}>
          {score}
        </div>
        <div style={{ color: "#999", fontSize: 20 }}>취향 싱크로율</div>
        <div style={{ color: "white", fontSize: 18, marginTop: 24, textAlign: "center", maxWidth: 500 }}>
          {comment}
        </div>
        <div style={{ color: "#666", fontSize: 14, marginTop: 32 }}>
          tunematch.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
