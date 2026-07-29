import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type Recipient = {
  name?: string;
  email: string;
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY missing' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const subject = String(body.subject || '').trim();
    const html = String(body.html || body.message || '').trim();
    const text = String(body.text || '').trim();
    const recipients: Recipient[] = Array.isArray(body.recipients)
      ? body.recipients
      : [];

    if (!subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, error: 'חסר נושא או תוכן' },
        { status: 400 }
      );
    }

    const clean = recipients
      .map((r) => ({
        name: String(r.name || '').trim(),
        email: String(r.email || '').trim().toLowerCase(),
      }))
      .filter((r) => r.email && r.email.includes('@'));

    if (clean.length === 0) {
      return NextResponse.json(
        { success: false, error: 'אין נמענים תקינים' },
        { status: 400 }
      );
    }

    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    let sent = 0;
    const errors: string[] = [];

    // שולחים אחד-אחד כדי לא להיתקע על bulk limits בבדיקות
    for (const r of clean) {
      try {
        const personalHtml = (html || text)
          .replace(/\{\{name\}\}/g, r.name || '')
          .replace(/\*שם\*/g, r.name || '');

        const { error } = await resend.emails.send({
          from,
          to: r.email,
          subject,
          html: personalHtml.includes('<')
            ? personalHtml
            : `<div dir="rtl" style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.6">${personalHtml}</div>`,
        });

        if (error) {
          errors.push(`${r.email}: ${error.message || 'error'}`);
        } else {
          sent += 1;
        }
      } catch (e: any) {
        errors.push(`${r.email}: ${e?.message || 'error'}`);
      }
    }

    return NextResponse.json({
      success: sent > 0,
      sent,
      failed: errors.length,
      errors: errors.slice(0, 10),
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'server error' },
      { status: 500 }
    );
  }
}