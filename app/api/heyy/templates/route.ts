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

    const extractList = (data: any): any[] => {
      if (!data) return [];
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.data?.messageTemplates)) return data.data.messageTemplates;
      if (Array.isArray(data?.messageTemplates)) return data.messageTemplates;
      if (Array.isArray(data?.templates)) return data.templates;
      if (Array.isArray(data)) return data;
      return [];
    };

    // 1) ניסיון ראשי — search v3
    const bodies = [
      { pagination: { page: 0, limit: 50 }, sortBy: 'updatedAt:DESC' },
      { pagination: { page: 0, limit: 50 } },
      { pagination: { page: 0, limit: 100 }, search: '' },
      {},
    ];

    for (const body of bodies) {
      try {
        const res = await fetch('https://api.heyy.io/v3/message_templates/search', {
          method: 'POST',
          headers,
          cache: 'no-store',
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);
        const list = extractList(data);
        if (res.ok && list.length > 0) {
          // אם יש עוד עמודים
          let all = [...list];
          const total = Number(data?.pagination?.total || list.length);
          let page = 1;
          while (all.length < total && page < 10) {
            const res2 = await fetch('https://api.heyy.io/v3/message_templates/search', {
              method: 'POST',
              headers,
              cache: 'no-store',
              body: JSON.stringify({
                ...body,
                pagination: { page, limit: 50 },
              }),
            });
            const data2 = await res2.json().catch(() => null);
            const more = extractList(data2);
            if (!more.length) break;
            all = all.concat(more);
            page += 1;
          }
          const map = new Map<string, any>();
          for (const t of all) if (t?.id) map.set(String(t.id), t);
          return NextResponse.json({
            success: true,
            count: map.size,
            templates: Array.from(map.values()),
            source: 'v3/search',
          });
        }
      } catch {}
    }

    // 2) Fallback — GET ישן (מה שעבד לך קודם)
    const getUrls = [
      'https://api.heyy.io/v2/message_templates?pageSize=100',
      'https://api.heyy.io/v2/message_templates?limit=100',
      'https://api.heyy.io/v2/message_templates',
      'https://api.heyy.io/v3/message_templates?limit=100',
    ];

    let best: any[] = [];
    let lastError: any = null;

    for (const url of getUrls) {
      try {
        const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
        const data = await res.json().catch(() => null);
        const list = extractList(data);
        if (res.ok && list.length > best.length) best = list;
        if (!res.ok) lastError = data;
      } catch (e: any) {
        lastError = e?.message || e;
      }
    }

    if (best.length > 0) {
      const map = new Map<string, any>();
      for (const t of best) if (t?.id) map.set(String(t.id), t);
      return NextResponse.json({
        success: true,
        count: map.size,
        templates: Array.from(map.values()),
        source: 'v2/get-fallback',
      });
    }

    return NextResponse.json(
      { success: false, error: lastError || 'לא נמצאו תבניות' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'שגיאת שרת' },
      { status: 500 }
    );
  }
}