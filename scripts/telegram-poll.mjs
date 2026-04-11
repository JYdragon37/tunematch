/**
 * Telegram Long Polling 스크립트
 * 실행: node scripts/telegram-poll.mjs
 * Next.js dev 서버와 별도 터미널에서 실행
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 읽기
const envPath = join(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim().replace(/^["']|["']$/g, "")];
    })
);

const TOKEN = env.TELEGRAM_BOT_TOKEN;
const AUTHORIZED_CHAT_ID = env.TELEGRAM_CHAT_ID;
const BASE = `https://api.telegram.org/bot${TOKEN}`;
const NEXT_URL = env.NEXTAUTH_URL || "http://localhost:3000";

if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN이 없습니다.");
  process.exit(1);
}

console.log("🤖 TuneMatch Telegram Bot 폴링 시작...");
console.log(`📡 인증된 채팅 ID: ${AUTHORIZED_CHAT_ID}`);
console.log("⌨️  텔레그램에서 /help 로 명령어 확인\n");

// ─── API 함수 ───

async function sendMessage(chatId, text) {
  try {
    const res = await fetch(`${BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) console.error("[sendMessage error]", data.description);
    return data.ok;
  } catch (e) {
    console.error("[sendMessage error]", e.message);
    return false;
  }
}

async function getUpdates(offset) {
  const res = await fetch(`${BASE}/getUpdates?offset=${offset}&timeout=30&limit=10`);
  const data = await res.json();
  return data.ok ? data.result : [];
}

// ─── 명령어 처리 ───

async function handleCommand(text, chatId) {
  if (chatId !== AUTHORIZED_CHAT_ID) {
    await sendMessage(chatId, "⛔ 권한이 없습니다.");
    return;
  }

  const cmd = text.trim().split(" ")[0].toLowerCase();
  const args = text.trim().split(" ").slice(1).join(" ");

  console.log(`[명령] ${cmd} ${args} (from ${chatId})`);

  switch (cmd) {
    case "/start":
    case "/help":
      await sendMessage(chatId,
        `🤖 <b>TuneMatch Bot 활성화!</b>\n\n` +
        `📋 <b>사용 가능한 명령어:</b>\n` +
        `/status — 서버 상태\n` +
        `/build — 빌드 실행\n` +
        `/analyze — 최신 분석 결과\n` +
        `/git — git 상태\n` +
        `/push — git push\n` +
        `/restart — 서버 재시작\n` +
        `/help — 이 도움말\n\n` +
        `💬 그 외 메시지는 로그에 기록됩니다.`
      );
      break;

    case "/status":
      try {
        const res = await fetch(`${NEXT_URL}/`);
        const running = res.status === 200;
        await sendMessage(chatId,
          `${running ? "✅" : "❌"} <b>서버 상태</b>\n\n` +
          `Next.js: ${running ? "🟢 실행 중" : "🔴 중단"} (${NEXT_URL})\n` +
          `⏰ ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`
        );
      } catch {
        await sendMessage(chatId, "❌ 서버에 연결할 수 없습니다.");
      }
      break;

    case "/build":
      await sendMessage(chatId, "🔨 빌드 시작 중...");
      try {
        const { stdout, stderr } = await execAsync("npm run build 2>&1", {
          cwd: join(__dirname, ".."),
          timeout: 120000,
        });
        const out = (stdout + stderr).slice(-600);
        const success = out.includes("Generating static pages") || out.includes("✓");
        await sendMessage(chatId,
          `${success ? "✅ 빌드 성공!" : "❌ 빌드 실패"}\n\n<code>${out.slice(-400)}</code>`
        );
      } catch (e) {
        await sendMessage(chatId, `❌ 빌드 오류:\n<code>${e.message.slice(0, 300)}</code>`);
      }
      break;

    case "/git":
      try {
        const { stdout } = await execAsync("git status --short && git log --oneline -5", {
          cwd: join(__dirname, ".."),
        });
        await sendMessage(chatId, `📁 <b>Git 상태</b>\n\n<code>${stdout.slice(0, 500)}</code>`);
      } catch (e) {
        await sendMessage(chatId, `❌ git 오류: ${e.message}`);
      }
      break;

    case "/push":
      await sendMessage(chatId, "🚀 git push 실행 중...");
      try {
        const { stdout } = await execAsync("git push origin main 2>&1", {
          cwd: join(__dirname, ".."),
          timeout: 30000,
        });
        await sendMessage(chatId, `✅ <b>Push 완료!</b>\n\n<code>${stdout.slice(0, 300)}</code>`);
      } catch (e) {
        await sendMessage(chatId, `❌ Push 실패:\n<code>${e.message.slice(0, 300)}</code>`);
      }
      break;

    case "/analyze": {
      try {
        const res = await fetch(`${NEXT_URL}/api/telegram/setup?action=analyze_latest`);
        // notify API 사용
        const supabaseUrl = env.SUPABASE_URL;
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
        const dbRes = await fetch(
          `${supabaseUrl}/rest/v1/match_results?select=id,user_a_name,comment_type,taste_type,diversity_index,channel_count&order=created_at.desc&limit=1`,
          { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
        );
        const rows = await dbRes.json();
        const row = rows[0];
        if (!row) { await sendMessage(chatId, "📭 분석 결과가 없습니다."); break; }

        await sendMessage(chatId,
          `📊 <b>최신 분석 결과</b>\n\n` +
          `👤 ${row.user_a_name}\n` +
          `🎯 ${row.comment_type || "분석됨"}\n` +
          `📺 구독 채널: ${row.channel_count || "?"}개\n` +
          `🎨 다양성: ${row.diversity_index || "?"}점\n\n` +
          `🔗 <a href="${NEXT_URL}">TuneMatch에서 보기</a>`
        );
      } catch (e) {
        await sendMessage(chatId, `❌ 조회 실패: ${e.message}`);
      }
      break;
    }

    case "/restart":
      await sendMessage(chatId, "🔄 서버 재시작은 터미널에서 직접 해주세요:\n<code>npm run dev</code>");
      break;

    default:
      // 일반 메시지 — 로그만 기록
      console.log(`[메시지] "${text}"`);
      await sendMessage(chatId,
        `💬 메시지 수신: "${text}"\n\n명령어를 사용하려면 /help`
      );
  }
}

// ─── 폴링 루프 ───

let offset = 0;

async function poll() {
  while (true) {
    try {
      const updates = await getUpdates(offset);
      for (const update of updates) {
        offset = update.update_id + 1;
        const msg = update.message;
        if (!msg?.text) continue;

        const chatId = String(msg.chat.id);
        const text = msg.text;
        const from = msg.from?.first_name || "Unknown";

        console.log(`📩 [${from}] ${text}`);
        await handleCommand(text, chatId);
      }
    } catch (e) {
      console.error("[poll error]", e.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

poll();
