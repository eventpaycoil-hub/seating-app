// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const TEMPLATES = [
  {
    id: 'classic-cream',
    name: 'קלאסי שמנת',
    bg: '#f7f3eb',
    text: '#1c1917',
    muted: '#57534e',
    line: '#d6d3d1',
  },
  {
    id: 'modern-dark',
    name: 'מודרני כהה',
    bg: '#1c1917',
    text: '#fafaf9',
    muted: '#a8a29e',
    line: '#44403c',
  },
  {
    id: 'romantic',
    name: 'רומנטי',
    bg: '#fff1f2',
    text: '#4c0519',
    muted: '#9f1239',
    line: '#fecdd3',
  },
  {
    id: 'floral',
    name: 'פרחוני',
    bg: '#f7faf5',
    text: '#365314',
    muted: '#4d7c0f',
    line: '#d9f99d',
  },
  {
    id: 'emerald',
    name: 'ירוק אלגנטי',
    bg: '#ecfdf5',
    text: '#064e3b',
    muted: '#047857',
    line: '#a7f3d0',
  },
];

const EMPTY = {
  templateId: 'classic-cream',
  owners: '',
  eventType: 'חתונה',
  quote: '',
  date: '',
  hebrewDate: '',
  receptionTime: '19:30',
  chuppahTime: '20:30',
  hallName: '',
  city: '',
  welcomeLine: 'נשמח לראותכם',
  groomParents: '',
  brideParents: '',
  monogram: '',
  showRsvpButton: false,
  coverUrl: '',
};

export default function InviteBuilderPage() {
  const params = useParams();
  const eventId = String(params?.id || '');
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    try {
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const ev = events.find((e: any) => String(e.id) === String(eventId));
      const inv = JSON.parse(localStorage.getItem(`invitation_${eventId}`) || 'null');

      setForm((prev) => ({
        ...prev,
        ...(inv || {}),
        owners: inv?.owners || ev?.owners || ev?.title || '',
        eventType: inv?.eventType || ev?.eventType || 'חתונה',
        date: inv?.date || ev?.fullDate || ev?.eventDate || ev?.date || '',
        receptionTime: inv?.receptionTime || ev?.time || '19:30',
        chuppahTime: inv?.chuppahTime || '20:30',
        hallName: inv?.hallName || ev?.hallName || '',
        city: inv?.city || ev?.city || '',
        welcomeLine: inv?.welcomeLine || ev?.welcomeLine || 'נשמח לראותכם',
        groomParents: inv?.groomParents || ev?.groomParents || '',
        brideParents: inv?.brideParents || ev?.brideParents || '',
        monogram: inv?.monogram || '',
        quote: inv?.quote || '',
        hebrewDate: inv?.hebrewDate || '',
        showRsvpButton: inv?.showRsvpButton === true,
        coverUrl: inv?.coverUrl || ev?.coverUrl || '',
        templateId: inv?.templateId || 'classic-cream',
      }));
    } catch (e) {
      console.warn(e);
    }
  }, [eventId]);

  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === form.templateId) || TEMPLATES[0],
    [form.templateId]
  );

  const formatDate = (d: string) => {
    if (!d) return '';
    if (String(d).includes('/')) return d;
    if (/^\d{4}-\d{2}-\d{2}/.test(String(d))) {
      const [y, m, day] = String(d).slice(0, 10).split('-');
      return `${day}.${m}.${y}`;
    }
    return d;
  };

  const publicLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/invite/${eventId}`
      : `https://www.eventpay1.co.il/invite/${eventId}`;

  const save = () => {
    localStorage.setItem(`invitation_${eventId}`, JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyLink = () => {
    save();
    navigator.clipboard.writeText(publicLink);
    alert('✅ לינק ההזמנה הועתק');
  };

  const set = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-zinc-100" dir="rtl">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">בניית הזמנה</h1>
            <p className="text-slate-500 text-sm mt-1">סגנון הזמנות מודפסות · דיגיטלי</p>
          </div>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-sm">
            ← חזרה למוזמנים
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* טופס */}
          <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-5">
            <div>
              <div className="font-bold mb-3">תבנית</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set('templateId', t.id)}
                    className={`rounded-2xl p-3 text-right border-2 transition ${
                      form.templateId === t.id
                        ? 'border-amber-500 ring-2 ring-amber-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="h-12 rounded-xl mb-2 border" style={{ background: t.bg }} />
                    <div className="text-sm font-medium">{t.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-bold">פרטים</div>
              <input className="w-full border rounded-2xl px-4 py-3" placeholder="שמות (למשל נופר והנסיך)" value={form.owners} onChange={(e) => set('owners', e.target.value)} />
              <input className="w-full border rounded-2xl px-4 py-3" placeholder="ראשי תיבות (למשל N&H)" value={form.monogram} onChange={(e) => set('monogram', e.target.value)} />
              <input className="w-full border rounded-2xl px-4 py-3" placeholder="ציטוט / פסוק (אופציונלי)" value={form.quote} onChange={(e) => set('quote', e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full border rounded-2xl px-4 py-3" placeholder="תאריך לועזי" value={form.date} onChange={(e) => set('date', e.target.value)} />
                <input className="w-full border rounded-2xl px-4 py-3" placeholder="תאריך עברי (אופציונלי)" value={form.hebrewDate} onChange={(e) => set('hebrewDate', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full border rounded-2xl px-4 py-3" placeholder="קבלת פנים" value={form.receptionTime} onChange={(e) => set('receptionTime', e.target.value)} />
                <input className="w-full border rounded-2xl px-4 py-3" placeholder="חופה" value={form.chuppahTime} onChange={(e) => set('chuppahTime', e.target.value)} />
              </div>
              <input className="w-full border rounded-2xl px-4 py-3" placeholder="אולם" value={form.hallName} onChange={(e) => set('hallName', e.target.value)} />
              <input className="w-full border rounded-2xl px-4 py-3" placeholder="עיר" value={form.city} onChange={(e) => set('city', e.target.value)} />
              <input className="w-full border rounded-2xl px-4 py-3" placeholder="משפט סיום" value={form.welcomeLine} onChange={(e) => set('welcomeLine', e.target.value)} />
              <input className="w-full border rounded-2xl px-4 py-3" placeholder="הורי החתן" value={form.groomParents} onChange={(e) => set('groomParents', e.target.value)} />
              <input className="w-full border rounded-2xl px-4 py-3" placeholder="הורי הכלה" value={form.brideParents} onChange={(e) => set('brideParents', e.target.value)} />

              <label className="flex items-center gap-2 text-sm pt-1">
                <input
                  type="checkbox"
                  checked={!!form.showRsvpButton}
                  onChange={(e) => set('showRsvpButton', e.target.checked)}
                />
                הצג כפתור "לאישור הגעה"
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={save} className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold">
                {saved ? '✅ נשמר' : 'שמירה'}
              </button>
              <button type="button" onClick={copyLink} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold">
                📋 העתק לינק
              </button>
              <Link href={`/invite/${eventId}`} target="_blank" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold">
                תצוגה מלאה ↗
              </Link>
            </div>
            <div className="text-xs text-slate-500 break-all bg-slate-50 rounded-xl p-3">{publicLink}</div>
          </div>

          {/* תצוגה מקדימה */}
          <div className="bg-white rounded-3xl border shadow-sm p-4 md:p-6">
            <div className="font-bold mb-3">תצוגה מקדימה</div>
            <InviteCard form={form} template={template} formatDate={formatDate} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteCard({ form, template, formatDate }: any) {
  return (
    <div
      className="mx-auto max-w-md rounded-sm shadow-xl border relative overflow-hidden"
      style={{
        background: template.bg,
        color: template.text,
        borderColor: template.line,
      }}
    >
      <div className="absolute top-4 left-4 text-[11px] opacity-60">בס״ד</div>

      <div className="px-8 pt-12 pb-10 text-center">
        {form.quote && (
          <div className="text-sm mb-5 opacity-80 leading-relaxed" style={{ color: template.muted }}>
            "{form.quote}"
          </div>
        )}

        {form.monogram && (
          <div className="text-3xl tracking-[0.2em] mb-3 font-light">{form.monogram}</div>
        )}

        <div className="text-xs tracking-[0.25em] uppercase mb-3 opacity-70">
          {form.eventType === 'חתונה' ? 'THE WEDDING' : form.eventType}
        </div>

        <div className="text-3xl sm:text-4xl font-serif leading-snug mb-2">
          {form.owners || 'שמות בעלי השמחה'}
        </div>

        <div className="w-12 h-px mx-auto my-5" style={{ background: template.line }} />

        <div className="text-sm leading-relaxed mb-5" style={{ color: template.muted }}>
          הנכם מוזמנים לחגוג עמנו
        </div>

        <div className="text-3xl font-light tracking-wide mb-1">
          {formatDate(form.date) || '00.00.0000'}
        </div>
        {form.hebrewDate && (
          <div className="text-sm mb-4 opacity-70">{form.hebrewDate}</div>
        )}

        <div className="text-sm mb-5">
          {[form.hallName, form.city].filter(Boolean).join(' | ') || 'אולם | עיר'}
        </div>

        <div className="flex justify-center gap-8 text-sm mb-6">
          <div>
            <div className="opacity-60 text-xs mb-1">קבלת פנים</div>
            <div className="font-medium">{form.receptionTime || '19:30'}</div>
          </div>
          <div className="w-px" style={{ background: template.line }} />
          <div>
            <div className="opacity-60 text-xs mb-1">חופה וקידושין</div>
            <div className="font-medium">{form.chuppahTime || '20:30'}</div>
          </div>
        </div>

        <div className="text-sm mb-6 opacity-80">{form.welcomeLine}</div>

        {(form.groomParents || form.brideParents) && (
          <div className="flex justify-between gap-4 text-xs pt-2" style={{ color: template.muted }}>
            <div className="text-right flex-1">
              <div className="mb-1 opacity-70">הורי החתן</div>
              <div className="whitespace-pre-line">{form.groomParents}</div>
            </div>
            <div className="text-left flex-1">
              <div className="mb-1 opacity-70">הורי הכלה</div>
              <div className="whitespace-pre-line">{form.brideParents}</div>
            </div>
          </div>
        )}

        {form.showRsvpButton && (
          <div className="mt-8">
            <span
              className="inline-block px-8 py-3 rounded-full text-sm font-medium border"
              style={{ borderColor: template.line }}
            >
              לאישור הגעה
            </span>
          </div>
        )}
      </div>
    </div>
  );
}