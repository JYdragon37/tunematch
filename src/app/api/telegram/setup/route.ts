import { NextRequest, NextResponse } from "next/server";
import { setWebhook, deleteWebhook, sendMessage } from "@/lib/telegram";

// GET /api/telegram/setup?action=set&url=https://xxx.ngrok.io
// GET /api/telegram/setup?action=delete
// GET /api/telegram/setup?action=test
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const webhookUrl = searchParams.get("url");

  if (action === "set" && webhookUrl) {
    const fullUrl = `${webhookUrl}/api/telegram/webhook`;
    const ok = await setWebhook(fullUrl);
    return NextResponse.json({ ok, webhookUrl: fullUrl });
  }

  if (action === "delete") {
    await deleteWebhook();
    return NextResponse.json({ ok: true, message: "Webhook 삭제됨" });
  }

  if (action === "test") {
    const ok = await sendMessage(
      "✅ <b>TuneMatch Bot 연결 테스트 성공!</b>\n\n" +
      "봇이 정상적으로 작동하고 있어요. /help 로 명령어를 확인하세요."
    );
    return NextResponse.json({ ok, message: "테스트 메시지 전송됨" });
  }

  return NextResponse.json({
    usage: {
      test: "/api/telegram/setup?action=test",
      set: "/api/telegram/setup?action=set&url=https://your-ngrok-url",
      delete: "/api/telegram/setup?action=delete",
    },
  });
}
