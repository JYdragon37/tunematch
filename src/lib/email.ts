/**
 * 이메일 알림 서비스
 * Mock 모드: console.log로 대체
 * 실제: Resend API 사용
 */

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean }> {
  if (isMockMode || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("mock")) {
    console.log("📧 [Mock Email 발송]");
    console.log(`  받는 사람: ${options.to}`);
    console.log(`  제목: ${options.subject}`);
    console.log(`  내용 미리보기: ${options.html.substring(0, 100)}...`);
    return { success: true };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return { success: true };
  } catch (error) {
    console.error("[Email 발송 실패]", error);
    return { success: false };
  }
}

export function buildNotificationEmail(params: {
  aName: string;
  bName: string;
  resultUrl: string;
}): EmailOptions {
  return {
    to: "",
    subject: `🎯 ${params.bName}님이 TuneMatch에 응했어요!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">🎯 TuneMatch</h1>
        <p><strong>${params.bName}</strong>님이 궁합 분석에 응했어요!</p>
        <p>${params.aName}님과 ${params.bName}님의 유튜브 취향 궁합 결과가 준비됐습니다.</p>
        <a href="${params.resultUrl}"
           style="display: inline-block; background: #FF4D00; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          결과 확인하기
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          TuneMatch · 유튜브 취향 궁합 분석 서비스
        </p>
      </div>
    `,
  };
}
