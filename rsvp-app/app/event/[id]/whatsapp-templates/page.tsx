'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

const AUTOMATION_ID = 'e3d8174d-2823-4d4f-a923-32cda5537f39';

type HeyyTemplate = {
  id: string;
  name?: string;
  status?: string;
  category?: string;
  language?: string;
};

export default function WhatsAppTemplatesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = (params?.id as string) || '1';

  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [templates, setTemplates] = useState<HeyyTemplate[]>([]);
  const [selected, setSelected] = useState<HeyyTemplate | null>(null);
  const [phone, setPhone] = useState('0505270152');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    try {
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const event = events.find((e: any) => e.id.toString() === eventId.toString());
      if (event) setCurrentEvent(event);
    } catch {}
  }, [eventId]);

  useEffect(() => {
    const p = searchParams.get('phone');
    if (p) setPhone(p);
  }, [searchParams]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/heyy/templates', { cache: 'no-store' });
      const data = await res.json();

      if (!data.success) {
        setError(
          typeof data.error === 'string'
            ? data.error
            : JSON.stringify(data.error || data)
        );
        setTemplates([]);
        return;
      }

      let list: HeyyTemplate[] = [];
      if (Array.isArray(data.templates)) list = data.templates;
      else if (Array.isArray(data?.data?.messageTemplates)) list = data.data.messageTemplates;
      else if (Array.isArray(data?.messageTemplates)) list = data.messageTemplates;

      const hasStatus = list.some((t) => !!t.status);
      if (hasStatus) {
        const approved = list.filter(
          (t) => String(t.status || '').toUpperCase() === 'APPROVED'
        );
        list = approved.length > 0 ? approved : list;
      }

      setTemplates(list);
      if (list.length > 0) setSelected(list[0]);
      else setSelected(null);
    } catch (e: any) {
      setError(e?.message || 'שגיאת רשת');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const visibleTemplates = templates.filter((t) => {
    if (!search.trim()) return true;
    return (t.name || '').toLowerCase().includes(search.trim().toLowerCase());
  });

  const buildAttributesForGuest = (guestId?: string | null) => {
    const owners = currentEvent?.owners || currentEvent?.title || 'בעלי השמחה';
    const eventType = currentEvent?.eventType || 'אירוע';
    const date =
      currentEvent?.eventDate ||
      currentEvent?.fullDate ||
      currentEvent?.date ||
      '';
    const time = currentEvent?.time || '';

    const general_text_1 = `${eventType} של ${owners}`;
    const general_text_2 = time ? `${date} בשעה ${time}` : date;

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://seating-app-dusky.vercel.app';

    const rsvp_link = guestId
      ? `${origin}/landing?eventId=${eventId}&guestId=${guestId}`
      : `${origin}/landing?eventId=${eventId}`;

    return { general_text_1, general_text_2, rsvp_link };
  };

  const sendTemplate = async () => {
    setSending(true);
    setResult(null);
    setError(null);

    try {
      let selectedIds: any[] = [];
      try {
        selectedIds = JSON.parse(localStorage.getItem('selectedForWhatsApp') || '[]');
      } catch {}

      let allGuests: any[] = [];
      try {
        allGuests = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');
      } catch {}

      // גיבוי אם נשמר במפתח אחר
      if (allGuests.length === 0) {
        try {
          const raw = localStorage.getItem('myGuests') || localStorage.getItem(`guests_${eventId}`);
          if (raw) allGuests = JSON.parse(raw);
        } catch {}
      }

      let targets: { phone: string; name: string; guestId: string }[] = [];

      if (selectedIds.length > 0 && allGuests.length > 0) {
        targets = allGuests
          .filter(
            (g: any) =>
              selectedIds.includes(g.id) ||
              selectedIds.includes(String(g.id)) ||
              selectedIds.includes(Number(g.id))
          )
          .filter((g: any) => g.phone && String(g.phone).trim())
          .map((g: any) => ({
            phone: String(g.phone).trim(),
            name: g.name || '',
            guestId: String(g.id),
          }));
      }

      if (targets.length === 0) {
        if (!phone.trim()) {
          alert('הזן מספר טלפון או בחר מוזמנים ברשימה');
          setSending(false);
          return;
        }
        const gid = searchParams.get('guestId') || '';
        targets = [{ phone: phone.trim(), name: '', guestId: gid }];
      }

      const campaignName = `וואטסאפ - ${currentEvent?.owners || eventId} - ${Date.now()}`;

      const phonesPayload = targets.map((t) => ({
        phone: t.phone,
        name: t.name,
        attributes: buildAttributesForGuest(t.guestId || null),
      }));

      const attributes = buildAttributesForGuest(
        targets[0]?.guestId || searchParams.get('guestId')
      );

      const res = await fetch('/api/heyy/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          automationId: AUTOMATION_ID,
          phones: phonesPayload,
          attributes,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : JSON.stringify(data.error || data);
        setError(msg);
        setResult(null);
      } else {
        setResult(
          `✅ נשלח ל־${targets.length} מוזמנים\n${attributes.general_text_1}\n${attributes.general_text_2}`
        );
        localStorage.removeItem('selectedForWhatsApp');
      }
    } catch (e: any) {
      setError(e?.message || 'שגיאת שליחה');
    } finally {
      setSending(false);
    }
  };

  const previewAttrs = buildAttributesForGuest(searchParams.get('guestId'));

  return (
    <div className="min-h-screen bg-zinc-100 p-6 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">תבניות וואטסאפ</h1>
            {currentEvent && (
              <p className="text-gray-600 mt-2 text-lg">
                אירוע:{' '}
                <span className="font-bold text-emerald-700">
                  {currentEvent.owners || currentEvent.title}
                </span>
                {currentEvent.hallName ? ` · ${currentEvent.hallName}` : ''}
                {currentEvent.eventDate || currentEvent.date
                  ? ` · ${currentEvent.eventDate || currentEvent.date}`
                  : ''}
              </p>
            )}
            {!currentEvent && (
              <p className="text-amber-600 mt-2 text-sm">
                לא נמצא אירוע ל־ID זה ב־localStorage
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadTemplates}
              className="px-5 py-3 rounded-2xl bg-white border hover:bg-gray-50 font-medium"
            >
              🔄 רענון תבניות
            </button>
            <Link
              href={`/event/${eventId}/guests`}
              className="px-5 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              ← חזרה למוזמנים
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm whitespace-pre-wrap">
            {error}
          </div>
        )}
        {result && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-700 whitespace-pre-wrap">
            {result}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-xl font-bold mb-3">
              תבניות מאושרות {loading ? '(טוען...)' : `(${templates.length})`}
            </h2>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם תבנית..."
              className="w-full border rounded-2xl px-4 py-3 mb-4"
            />

            <div className="space-y-3 max-h-[75vh] overflow-y-auto pe-1">
              {visibleTemplates.length === 0 && !loading ? (
                <p className="text-gray-500 text-center py-10">לא נמצאו תבניות</p>
              ) : (
                visibleTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t)}
                    className={`w-full text-right p-4 rounded-2xl border-2 transition ${
                      selected?.id === t.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-lg">{t.name || 'ללא שם'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t.category || ''} {t.language ? `· ${t.language}` : ''}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow p-6 h-fit sticky top-6">
            <h2 className="text-xl font-bold mb-4">שליחה</h2>

            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-sm space-y-1">
              <div>
                <span className="text-gray-500">שורה 1: </span>
                <strong>{previewAttrs.general_text_1}</strong>
              </div>
              <div>
                <span className="text-gray-500">שורה 2: </span>
                <strong>{previewAttrs.general_text_2 || '—'}</strong>
              </div>
              <div className="text-xs text-gray-500 break-all pt-1">
                קישור: {previewAttrs.rsvp_link}
              </div>
            </div>

            {selected ? (
              <div className="mb-4 p-4 rounded-2xl bg-gray-50">
                <div className="text-sm text-gray-500 mb-1">תבנית נבחרת (לתצוגה)</div>
                <div className="font-bold text-lg">{selected.name}</div>
              </div>
            ) : (
              <p className="text-gray-400 mb-4">
                אין חובה לבחור מהרשימה — נשלח דרך האוטומציה
              </p>
            )}

            <label className="block text-sm font-medium mb-2">מספר טלפון</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-..."
              className="w-full border rounded-2xl px-5 py-4 mb-4"
            />

            <button
              type="button"
              onClick={sendTemplate}
              disabled={sending}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-2xl font-bold text-lg"
            >
              {sending ? '⏳ שולח...' : '📱 שלח בוואטסאפ'}
            </button>

            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
              קישור אישי נבנה אוטומטית לכל מוזמן שנבחר ברשימה (guestId).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}