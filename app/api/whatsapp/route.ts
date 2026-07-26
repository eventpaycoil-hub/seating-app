import { NextResponse } from 'next/server';

const HEYY_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdkMGE1YTg4LTA4ZjItNDgxNS1hZmZlLTAxYmM5Y2JjNGYxMiIsImFwaUtleUlkIjoiMThiN2FhMmEtYjM2My00MDE1LTg4ZWQtMDAyMWU5ODZjNjgwIiwiaWF0IjoxNzg0MzUyMzkwfQ.PylW33Ko1T_PBKt8r0E0oKsMPgEXfNy08GGWWpqAH_0';

export async function POST() {
  try {
    const res = await fetch('https://api.heyy.io/v3/message_templates/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HEYY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '',
        sortBy: 'createdAt',
        search: '',
        pagination: { page: 0, limit: 50 },
      }),
    });

    const text = await res.text();
    let raw: any = null;
    try {
      raw = JSON.parse(text);
    } catch {
      raw = text;
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          status: res.status,
          error: raw?.error || raw,
          message: 'Heyy החזיר שגיאה – בדוק טוקן / חשבון',
        },
        { status: 200 }
      );
    }

    // ניסיון לחלץ רשימת תבניות מכל מבנה אפשרי
    const list =
      raw?.data?.items ||
      raw?.data?.templates ||
      raw?.data ||
      raw?.items ||
      raw?.templates ||
      (Array.isArray(raw) ? raw : []);

    const templates = (Array.isArray(list) ? list : []).map((t: any, i: number) => ({
      id: t.id || t._id || `tpl-${i}`,
      name: t.name || t.vendorDetails?.name || t.vendorDetailsName || `תבנית ${i + 1}`,
      status: t.status || '',
      content:
        t.messageContent?.text ||
        t.messageContent?.body ||
        t.content ||
        t.body ||
        JSON.stringify(t.messageContent || t, null, 2),
      raw: t,
    }));

    return NextResponse.json({
      success: true,
      count: templates.length,
      templates,
      raw,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'שגיאת שרת',
      },
      { status: 200 }
    );
  }
}