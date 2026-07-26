import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, phones, message, items } = body;

    const TOKEN =
      process.env.SMS_019_TOKEN ||
      'eyJ0eXAiOiJqd3QiLCJhbGciOiJIUzI1NiJ9.eyJmaXJzdF9rZXkiOiIxMTAxNyIsInNlY29uZF9rZXkiOiIxMDQ0MTQ0IiwiaXNzdWVkQXQiOiIxNC0wNy0yMDI2IDE2OjMzOjUzIiwidHRsIjo2MzA3MjAwMH0.RO5-0XzJXFFlby-kxb9TT52TDbf9BxaQVocOs8do78k';
    const USERNAME = process.env.SMS_019_USERNAME || 'eventpay';
    const SOURCE = process.env.SMS_019_SOURCE || '0505270152';

    const cleanPhone = (raw: string) => {
      let p = String(raw || '').replace(/\D/g, '');
      if (p.length === 9 && p.startsWith('5')) p = '0' + p;
      return p;
    };

    const sendOne = async (to: string, text: string) => {
      const payload = {
        sms: {
          user: { username: USERNAME },
          source: SOURCE,
          destinations: { phone: [{ _: cleanPhone(to) }] },
          message: text,
        },
      };

      const response = await fetch('https://019sms.co.il/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => response.text());
      return { ok: response.ok, data, phone: to };
    };

    // מצב bulk מותאם אישית: [{ phone, message }]
    if (Array.isArray(items) && items.length > 0) {
      let sent = 0;
      let failed = 0;
      const errors: any[] = [];

      for (const item of items) {
        if (!item?.phone || !item?.message) {
          failed++;
          continue;
        }
        try {
          const r = await sendOne(item.phone, item.message);
          if (r.ok) sent++;
          else {
            failed++;
            errors.push({ phone: item.phone, error: r.data });
          }
        } catch (e: any) {
          failed++;
          errors.push({ phone: item.phone, error: e?.message });
        }
      }

      return NextResponse.json({
        success: sent > 0,
        sent,
        failed,
        errors: errors.slice(0, 5),
      });
    }

    // מצב ישן: מספר אחד / מערך עם אותה הודעה
    if (!message) {
      return NextResponse.json({ success: false, error: 'חסרה הודעה' }, { status: 400 });
    }

    let list: string[] = [];
    if (Array.isArray(phones) && phones.length > 0) {
      list = phones.map((p: any) => (typeof p === 'string' ? p : p?.phone || '')).filter(Boolean);
    } else if (phone) {
      list = [phone];
    }

    if (list.length === 0) {
      return NextResponse.json({ success: false, error: 'חסרים מספרים' }, { status: 400 });
    }

    // אותה הודעה לכולם — בקשה אחת ל־019
    const payload = {
      sms: {
        user: { username: USERNAME },
        source: SOURCE,
        destinations: {
          phone: list.map((p) => ({ _: cleanPhone(p) })),
        },
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
    });

    const data = await response.json().catch(() => response.text());

    if (response.ok) {
      return NextResponse.json({ success: true, sent: list.length, data });
    }
    return NextResponse.json({ success: false, error: data }, { status: 400 });
  } catch (error: any) {
    console.error('SMS Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}