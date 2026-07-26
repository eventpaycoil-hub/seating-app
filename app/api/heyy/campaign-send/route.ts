import { NextRequest, NextResponse } from 'next/server';

const AUTOMATION_ID = 'e3d8174d-2823-4d4f-a923-32cda5537f39';

function toIntlPhone(phone: string): string {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('972')) return '+' + p;
  if (p.length === 10 && p.startsWith('0')) return '+972' + p.slice(1);
  if (p.length === 9 && p.startsWith('5')) return '+972' + p;
  return p.startsWith('+') ? p : '+' + p;
}

async function heyyFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.heyy.io${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

async function upsertContactWithAttributes(
  token: string,
  phoneRaw: string,
  name: string,
  attributesMap: Record<string, string>
) {
  const phoneNumber = toIntlPhone(phoneRaw);
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'אורח';
  const lastName = parts.slice(1).join(' ') || '';

  const attributes = Object.entries(attributesMap || {})
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(([attrName, value]) => ({ name: attrName, value: String(value) }));

  const upsert = await heyyFetch('/v3/contacts/upsert', token, {
    method: 'POST',
    body: JSON.stringify({
      firstName,
      lastName,
      phoneNumber,
      attributes,
    }),
  });

  let id = upsert.data?.data?.id || upsert.data?.id;
  if (upsert.ok && id) {
    return { id, via: 'upsert', raw: upsert.data };
  }

  const search = await heyyFetch('/v3/contacts/search', token, {
    method: 'POST',
    body: JSON.stringify({
      search: phoneNumber,
      query: phoneNumber,
      pagination: { page: 1, limit: 20 },
    }),
  });

  const list = Array.isArray(search.data?.data)
    ? search.data.data
    : search.data?.data?.contacts || [];

  const digits = phoneNumber.replace(/\D/g, '').slice(-9);
  const found = list.find((c: any) =>
    String(c.phoneNumber || '').replace(/\D/g, '').includes(digits)
  );

  if (found?.id) {
    if (attributes.length > 0) {
      await heyyFetch(`/v3/contacts/${found.id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ attributes }),
      });
    }
    return { id: found.id, via: 'search+update', raw: { upsert: upsert.data, search: search.data } };
  }

  return { id: null, via: 'failed', raw: { upsert: upsert.data, search: search.data } };
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.HEYY_API_TOKEN;
    if (!token) {
      return NextResponse.json({ success: false, error: 'חסר HEYY_API_TOKEN' }, { status: 500 });
    }

    const body = await req.json();
    const {
      campaignName,
      phones,
      automationId = AUTOMATION_ID,
      attributes = {},
      variables = {},
    } = body;

    if (!campaignName || !Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json(
        { success: false, error: 'חסר campaignName או phones' },
        { status: 400 }
      );
    }

    const steps: any = {};
    const contactIds: string[] = [];
    const contactErrors: any[] = [];

    for (const item of phones) {
      const phoneRaw = typeof item === 'string' ? item : item.phone;
      const name = typeof item === 'string' ? '' : item.name || '';
      const perContactAttrs =
        typeof item === 'object' && item.attributes
          ? { ...attributes, ...item.attributes }
          : attributes;

      const result = await upsertContactWithAttributes(
        token,
        phoneRaw,
        name,
        perContactAttrs
      );

      if (result.id) contactIds.push(result.id);
      else contactErrors.push({ phone: phoneRaw, ...result });
    }

    steps.contacts = { count: contactIds.length, contactIds, errors: contactErrors };

    if (contactIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'לא נוצרו/נמצאו אנשי קשר', steps },
        { status: 400 }
      );
    }

    const campaignRes = await heyyFetch('/v3/campaigns', token, {
      method: 'POST',
      body: JSON.stringify({ name: campaignName, automationId, variables }),
    });
    const campaignId = campaignRes.data?.data?.id || campaignRes.data?.id || null;
    steps.campaign = { ok: campaignRes.ok, campaignId, response: campaignRes.data };

    if (!campaignRes.ok || !campaignId) {
      return NextResponse.json(
        { success: false, error: 'יצירת קמפיין נכשלה', steps },
        { status: 400 }
      );
    }

    const recipientsRes = await heyyFetch(`/v3/campaigns/${campaignId}/recipients`, token, {
      method: 'POST',
      body: JSON.stringify({ contactIds }),
    });
    steps.recipients = { ok: recipientsRes.ok, response: recipientsRes.data };

    if (!recipientsRes.ok) {
      return NextResponse.json(
        { success: false, error: 'הוספת נמענים נכשלה', steps },
        { status: 400 }
      );
    }

    const startRes = await heyyFetch(`/v3/campaigns/${campaignId}/start`, token, {
      method: 'POST',
      body: JSON.stringify({ variables }),
    });
    steps.start = { ok: startRes.ok, response: startRes.data };

    if (!startRes.ok) {
      return NextResponse.json(
        { success: false, error: 'הפעלת קמפיין נכשלה', steps },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      campaignId,
      campaignName,
      recipientsCount: contactIds.length,
      steps,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'שגיאת שרת' },
      { status: 500 }
    );
  }
}