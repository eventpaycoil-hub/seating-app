import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ success: false, error: 'חסרים פרטים' }, { status: 400 });
    }

    const TOKEN = 'eyJ0eXAiOiJqd3QiLCJhbGciOiJIUzI1NiJ9.eyJmaXJzdF9rZXkiOiIxMTAxNyIsInNlY29uZF9rZXkiOiIxMDQ0MTQ0IiwiaXNzdWVkQXQiOiIxNC0wNy0yMDI2IDE2OjMzOjUzIiwidHRsIjo2MzA3MjAwMH0.RO5-0XzJXFFlby-kxb9TT52TDbf9BxaQVocOs8do78k';
    const USERNAME = 'eventpay';
    const SOURCE = '0505270152';

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 9 && cleanPhone.startsWith('5')) cleanPhone = '0' + cleanPhone;

    const payload = {
      sms: {
        user: { username: USERNAME },
        source: SOURCE,
        destinations: {
          phone: [{ _: cleanPhone }]
        },
        message: message
      }
    };

    console.log('Sending SMS to:', cleanPhone);
    console.log('Message:', message);

    const response = await fetch('https://019sms.co.il/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => response.text());

    console.log('019 Response:', data);

    if (response.ok) {
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json({ success: false, error: data }, { status: 400 });
    }
  } catch (error: any) {
    console.error('SMS Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}