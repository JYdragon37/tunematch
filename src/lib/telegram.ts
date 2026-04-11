/**
 * Telegram Bot API 서비스
 * 분석 결과 전송 + 명령어 수신 처리
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─── 메시지 전송 ───

export async function sendMessage(
  text: string,
  chatId: string = CHAT_ID,
  options: { parseMode?: "HTML" | "Markdown"; disablePreview?: boolean } = {}
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || "HTML",
        disable_web_page_preview: options.disablePreview ?? true,
      }),
    });
    const data = await res.json();
    if (!data.ok) console.error("[Telegram sendMessage error]", data);
    return data.ok;
  } catch (err) {
    console.error("[Telegram error]", err);
    return false;
  }
}

// ─── Webhook 등록 ───

export async function setWebhook(webhookUrl: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    }),
  });
  const data = await res.json();
  console.log("[Telegram setWebhook]", data);
  return data.ok;
}

export async function deleteWebhook(): Promise<void> {
  await fetch(`${BASE_URL}/deleteWebhook`, { method: "POST" });
}

// ─── 솔로 분석 결과 포맷팅 ───

export function formatSoloResult(result: {
  userAName: string;
  tasteType?: string;
  commentType?: string;
  comment?: string;
  diversityIndex?: number;
  channelCount?: number;
  topCategories?: Array<{ emoji: string; label: string; percentage: number }>;
  channelStatsData?: {
    topSubscriber: { title: string; formattedCount: string };
    smallestSubscriber: { title: string; formattedCount: string };
    hiddenFanCount: number;
    countryDist: Array<{ label: string; percent: number }>;
  };
  likedVideoInsight?: {
    topCategoryLabel: string;
    matchScore: number;
    surpriseCategoryLabel?: string;
  };
}): string {
  const typeEmojis: Record<string, string> = {
    knowledge: "🧠", entertainment: "🎮", humor: "😂", music: "🎵",
    lifestyle: "🍳", news: "📰", tech: "💻", collector: "🌈",
  };
  const emoji = typeEmojis[result.tasteType || ""] || "🎯";

  let msg = `${emoji} <b>${result.userAName}의 유튜브 취향 분석 완료!</b>\n\n`;

  if (result.commentType) {
    msg += `📌 <b>${result.commentType}</b>\n`;
    msg += `"${result.comment}"\n\n`;
  }

  if (result.topCategories && result.topCategories.length > 0) {
    msg += `📊 <b>TOP 취향</b>\n`;
    result.topCategories.slice(0, 3).forEach((cat, i) => {
      msg += `${i + 1}. ${cat.emoji} ${cat.label} ${cat.percentage}%\n`;
    });
    msg += "\n";
  }

  if (result.channelCount) {
    msg += `📺 구독 채널: <b>${result.channelCount}개</b>\n`;
  }

  if (result.diversityIndex !== undefined) {
    const divLabel = result.diversityIndex >= 66 ? "다양형" : result.diversityIndex >= 36 ? "균형형" : "집중형";
    msg += `🎨 취향 다양성: <b>${divLabel}</b> (${result.diversityIndex}점)\n`;
  }

  if (result.channelStatsData) {
    const s = result.channelStatsData;
    msg += `\n🏆 <b>구독 기록관</b>\n`;
    msg += `👑 최다: ${s.topSubscriber.title} (${s.topSubscriber.formattedCount}명)\n`;
    msg += `🤍 최소: ${s.smallestSubscriber.title}\n`;
    if (s.hiddenFanCount > 0) msg += `🕵️ 소채널 팬: ${s.hiddenFanCount}개\n`;
    if (s.countryDist.length > 0) {
      msg += `🌍 ${s.countryDist.map(c => `${c.label} ${c.percent}%`).join(" / ")}\n`;
    }
  }

  if (result.likedVideoInsight) {
    const l = result.likedVideoInsight;
    msg += `\n❤️ <b>좋아요 분석</b>\n`;
    msg += `주로: ${l.topCategoryLabel} | 일치도: ${l.matchScore}%\n`;
    if (l.surpriseCategoryLabel) {
      msg += `⚡ 숨겨진 취향: ${l.surpriseCategoryLabel}\n`;
    }
  }

  msg += `\n🔗 <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}">TuneMatch에서 보기</a>`;
  return msg;
}

// ─── 명령어 처리 ───

export type BotCommand =
  | "/start"
  | "/status"
  | "/build"
  | "/log"
  | "/analyze"
  | "/help";

export async function handleCommand(command: string, chatId: string): Promise<void> {
  const authorizedChatId = process.env.TELEGRAM_CHAT_ID;

  // 인증된 유저만 허용
  if (chatId !== authorizedChatId) {
    await sendMessage("⛔ 권한이 없습니다.", chatId);
    return;
  }

  const cmd = command.split(" ")[0].toLowerCase() as BotCommand;

  switch (cmd) {
    case "/start":
    case "/help":
      await sendMessage(
        `🤖 <b>TuneMatch Bot</b>\n\n` +
        `사용 가능한 명령어:\n` +
        `/status — 서버 상태 확인\n` +
        `/build — 빌드 실행\n` +
        `/log — 최근 서버 로그\n` +
        `/analyze — 최신 분석 결과\n` +
        `/help — 도움말`,
        chatId
      );
      break;

    case "/status":
      await sendMessage(
        `✅ <b>서버 상태</b>\n\n` +
        `🟢 Next.js 서버: 실행 중\n` +
        `🟢 Supabase: 연결됨\n` +
        `📅 ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`,
        chatId
      );
      break;

    case "/build":
      await sendMessage("🔨 빌드 시작... (결과를 기다려주세요)", chatId);
      try {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);
        const { stdout, stderr } = await execAsync("npm run build 2>&1", {
          cwd: process.cwd(),
          timeout: 120000,
        });
        const output = (stdout + stderr).slice(-500);
        const success = output.includes("Generating static pages");
        await sendMessage(
          `${success ? "✅ 빌드 성공!" : "❌ 빌드 실패"}\n\n<code>${output.slice(-300)}</code>`,
          chatId
        );
      } catch (err: any) {
        await sendMessage(`❌ 빌드 오류: ${err.message?.slice(0, 200)}`, chatId);
      }
      break;

    case "/log":
      await sendMessage(
        `📋 <b>서버 로그</b>\n\n` +
        `로그는 터미널에서 확인하세요:\n` +
        `<code>npm run dev</code> 실행 중인 터미널 참고\n\n` +
        `Supabase 최근 세션은 /analyze로 확인`,
        chatId
      );
      break;

    case "/analyze": {
      try {
        const { supabaseAdmin } = await import("./supabase");
        const { data } = await supabaseAdmin
          .from("match_results")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!data) {
          await sendMessage("📭 분석 결과가 없습니다.", chatId);
          return;
        }

        const msg = formatSoloResult({
          userAName: data.user_a_name,
          tasteType: data.taste_type,
          commentType: data.comment_type,
          comment: data.comment,
          diversityIndex: data.diversity_index,
          channelCount: data.channel_count,
          topCategories: data.top_categories,
          channelStatsData: data.channel_stats_data,
          likedVideoInsight: data.liked_video_insight,
        });
        await sendMessage(msg, chatId);
      } catch (err) {
        await sendMessage("❌ 분석 결과 조회 실패", chatId);
      }
      break;
    }

    default:
      await sendMessage(`❓ 알 수 없는 명령어: ${cmd}\n/help 로 목록 확인`, chatId);
  }
}
