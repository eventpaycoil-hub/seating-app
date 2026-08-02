import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.HEYY_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'חסר HEYY_API_TOKEN ב-.env.local' },
        { status: 500 }
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const all: any[] = [];
    let page = 0;
    const limit = 50;
    let total = Infinity;

    // משיכה בעמודים עד שמסיימים
    while (all.length < total && page < 20) {
      const res = await fetch('https://api.heyy.io/v3/message_templates/search', {
        method: 'POST',
        headers,
        cache: 'no-store',
        body: JSON.stringify({
          sortBy: 'updatedAt:DESC',
          pagination: { page, limit },
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return NextResponse.json(
          {
            success: false,
            error: data?.error || data || `Heyy status ${res.status}`,
          },
          { status: res.status }
        );
      }

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.messageTemplates)
        ? data.data.messageTemplates
        : Array.isArray(data?.messageTemplates)
        ? data.messageTemplates
        : [];

      all.push(...list);

      total = Number(data?.pagination?.total ?? all.length);
      if (list.length === 0) break;
      page += 1;
    }

    // הסרת כפילויות
    const map = new Map<string, any>();
    for (const t of all) {
      if (t?.id) map.set(String(t.id), t);
    }
    const templates = Array.from(map.values());

    return NextResponse.json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'שגיאת שרת' },
      { status: 500 }
    );
  }
}