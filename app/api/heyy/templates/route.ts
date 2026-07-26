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
      if (Array.isArray(data.templates)) return data.templates;
      if (Array.isArray(data?.data?.messageTemplates)) return data.data.messageTemplates;
      if (Array.isArray(data?.messageTemplates)) return data.messageTemplates;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data)) return data;
      return [];
    };

    const tryFetch = async (url: string) => {
      const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
      const data = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, data, list: extractList(data) };
    };

    // ניסיונות שונים למשיכת כמה שיותר
    const attempts = [
      'https://api.heyy.io/v2/message_templates?pageSize=100',
      'https://api.heyy.io/v2/message_templates?limit=100',
      'https://api.heyy.io/v2/message_templates?take=100',
      'https://api.heyy.io/v2/message_templates?per_page=100',
      'https://api.heyy.io/v3/message_templates?pageSize=100',
      'https://api.heyy.io/v3/message_templates?limit=100',
      'https://api.heyy.io/v2/message_templates',
    ];

    let best: any[] = [];
    let lastError: any = null;

    for (const url of attempts) {
      const result = await tryFetch(url);
      if (result.ok && result.list.length > best.length) {
        best = result.list;
      }
      if (!result.ok) lastError = result.data;
    }

    // אם עדיין ~25 — ננסה offset בעמודים
    if (best.length > 0 && best.length <= 30) {
      const pageSize = best.length || 25;
      let offset = pageSize;
      for (let i = 0; i < 10; i++) {
        const urls = [
          `https://api.heyy.io/v2/message_templates?limit=${pageSize}&offset=${offset}`,
          `https://api.heyy.io/v2/message_templates?pageSize=${pageSize}&page=${i + 2}`,
          `https://api.heyy.io/v2/message_templates?take=${pageSize}&skip=${offset}`,
        ];

        let gotExtra = false;
        for (const url of urls) {
          const result = await tryFetch(url);
          if (result.ok && result.list.length > 0) {
            best = best.concat(result.list);
            gotExtra = true;
            break;
          }
        }
        if (!gotExtra) break;
        offset += pageSize;
      }
    }

    // הסרת כפילויות
    const map = new Map<string, any>();
    for (const t of best) {
      if (t?.id) map.set(String(t.id), t);
    }
    const templates = Array.from(map.values());

    if (templates.length === 0 && lastError) {
      return NextResponse.json(
        { success: false, error: lastError },
        { status: 400 }
      );
    }

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