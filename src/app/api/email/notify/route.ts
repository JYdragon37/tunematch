import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json();
    const result = await sendEmail({ to, subject, html });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "이메일 발송 실패" }, { status: 500 });
  }
}
