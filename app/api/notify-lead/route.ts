import { NextResponse } from 'next/server';

const ADMIN_PHONE = '0505270152';

const TOKEN =
  process.env.SMS_019_TOKEN ||
  'eyJ0eXAiOiJqd3QiLCJhbGciOiJIUzI1NiJ9.eyJmaXJzdF9rZXkiOiIxMTAxNyIsInNlY29uZF9rZXkiOiIxMDQ0MTQ0IiwiaXNzdWVkQXQiOiIxNC0wNy0yMDI2IDE2OjMzOjUzIiwidHRsIjo2MzA3MjAwMH0.RO5-0XzJXFFlby-kxb9TT52TDbf9BxaQVocOs8do78k';
const USERNAME = process.env.SMS_019_USERNAME || 'eventpay';
const SOURCE = process.env.SMS_019_SOURCE || '0505270152';

function cleanPhone(raw: string) {
  let p = String(raw || '').replace(/\D/g, '');
  if (p.length === 9 && p.startsWith('5')) p = '0' + p;
  return p;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || '').trim();
    const phone = String(body?.phone || '').trim();
    const date = String(body?.date || '').trim();
    const source = String(body?.source || 'דרך האתר').trim();

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'חסר שם או טלפון' },
        { status: 400 }
      );
    }

    const message =
      `שלום שמעון, התקבלה פנייה חדשה (${source})\n` +
      `שם: ${name}\n` +
      `טלפון: ${phone}\n` +
      `תאריך אירוע: ${date || 'לא צוין'}`;

    const payload = {
      sms: {
        user: { username: USERNAME },
        source: SOURCE,
        destinations: { phone: [{ _: cleanPhone(ADMIN_PHONE) }] },
        message,
      },
    };

    const response = await fetch('https://019sms.co.il/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => response.text());

    if (!response.ok) {
      console.error('notify-lead 019 error', data);
      return NextResponse.json(
        { success: false, error: data },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('notify-lead error', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'שגיאת שרת' },
      { status: 500 }
    );
  }
}