import { NextRequest, NextResponse } from "next/server";
import { handleCommand, sendMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  // Webhook secret 검증
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const message = body.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = String(message.chat.id);
    const text: string = message.text || "";

    console.log(`[Telegram] 메시지 수신: ${text} from ${chatId}`);

    if (text.startsWith("/")) {
      await handleCommand(text, chatId);
    } else {
      await sendMessage(
        `💬 안녕하세요! 명령어를 입력해주세요.\n/help 로 목록 확인`,
        chatId
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram webhook error]", err);
    return NextResponse.json({ ok: true }); // 항상 200 반환 (Telegram 재시도 방지)
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram webhook active" });
}
