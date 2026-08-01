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
    deco: 'none',
    frame: 'simple',
  },
  {
    id: 'double-frame',
    name: 'מסגרת כפולה',
    bg: '#faf8f4',
    text: '#1c1917',
    muted: '#57534e',
    line: '#a8a29e',
    deco: 'none',
    frame: 'double',
  },
  {
    id: 'rings',
    name: 'טבעות זהב',
    bg: '#fffbeb',
    text: '#422006',
    muted: '#92400e',
    line: '#fcd34d',
    deco: 'rings',
    frame: 'simple',
  },
  {
    id: 'floral-soft',
    name: 'פרחים רכים',
    bg: '#fdfcf9',
    text: '#365314',
    muted: '#4d7c0f',
    line: '#d9f99d',
    deco: 'floral',
    frame: 'simple',
  },
  {
    id: 'romantic-heart',
    name: 'רומנטי',
    bg: '#fff1f2',
    text: '#4c0519',
    muted: '#9f1239',
    line: '#fecdd3',
    deco: 'hearts',
    frame: 'simple',
  },
  {
    id: 'navy-elegant',
    name: 'כחול אלגנטי',
    bg: '#0f172a',
    text: '#f8fafc',
    muted: '#94a3b8',
    line: '#334155',
    deco: 'none',
    frame: 'double',
  },
  {
    id: 'olive-garden',
    name: 'ירוק זית',
    bg: '#f5f7f0',
    text: '#3f6212',
    muted: '#65a30d',
    line: '#bef264',
    deco: 'leaves',
    frame: 'simple',
  },
  {
    id: 'minimal-bw',
    name: 'מינימלי שחור',
    bg: '#ffffff',
    text: '#0a0a0a',
    muted: '#525252',
    line: '#e5e5e5',
    deco: 'line',
    frame: 'simple',
  },
  {
    id: 'vintage',
    name: 'וינטג׳',
    bg: '#faf7f2',
    text: '#44403c',
    muted: '#78716c',
    line: '#d6d3d1',
    deco: 'ornament',
    frame: 'double',
  },
  {
    id: 'bar-party',
    name: 'בר/בת שמח',
    bg: '#eff6ff',
    text: '#1e3a8a',
    muted: '#3b82f6',
    line: '#93c5fd',
    deco: 'stars',
    frame: 'simple',
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
  inviteLine: 'הנכם מוזמנים לחגוג עמנו',
  groomParents: '',
  brideParents: '',
  monogram: '',
  showRsvpButton: false,
};

function Deco({ type }) {
  if (type === 'rings') {
    return <div className="text-2xl mb-2 opacity-80">💍 💍</div>;
  }
  if (type === 'floral') {
    return <div className="text-lg mb-2 opacity-70">🌿 🌸 🌿</div>;
  }
  if (type === 'hearts') {
    return <div className="text-lg mb-2 opacity-70">♡</div>;
  }
  if (type === 'leaves') {
    return <div className="text-lg mb-2 opacity-70">🍃 ✨ 🍃</div>;
  }
  if (type === 'stars') {
    return <div className="text-lg mb-2 opacity-70">✦ ★ ✦</div>;
  }
  if (type === 'ornament') {
    return <div className="text-sm mb-2 tracking-[0.3em] opacity-60">❖ ❖ ❖</div>;
  }
  if (type === 'line') {
    return <div className="w-px h-8 mx-auto mb-3 bg-current opacity-40" />;
  }
  return null;
}

function InviteCard({ form, template, formatDate, compact = false }) {
  const pad = compact ? 'px-4 pt-8 pb-5' : 'px-8 pt-12 pb-10';
  const titleSize = compact ? 'text-base' : 'text-3xl sm:text-4xl';
  const dateSize = compact ? 'text-xl' : 'text-3xl';

  return (
    <div
      className="relative mx-auto w-full shadow-xl overflow-hidden"
      style={{
        background: template.bg,
        color: template.text,
        maxWidth: compact ? 280 : 420,
        border:
          template.frame === 'double'
            ? `3px double ${template.line}`
            : `1px solid ${template.line}`,
      }}
    >
      <div className={`absolute ${compact ? 'top-1.5 left-1.5 text-[8px]' : 'top-3 left-3 text-[11px]'} opacity-50`}>
        בס״ד
      </div>

      {/* פינות פרחוניות */}
      {template.deco === 'floral' && (
        <>
          <div className={`absolute ${compact ? 'top-1 right-1 text-sm' : 'top-2 right-2 text-xl'} opacity-50`}>🌸</div>
          <div className={`absolute ${compact ? 'bottom-1 left-1 text-sm' : 'bottom-2 left-2 text-xl'} opacity-50`}>🌿</div>
          <div className={`absolute ${compact ? 'bottom-1 right-1 text-sm' : 'bottom-2 right-2 text-xl'} opacity-50`}>🌸</div>
        </>
      )}

      <div className={`${pad} text-center`}>
        {form.quote && !compact && (
          <div className="text-sm mb-4 leading-relaxed opacity-80" style={{ color: template.muted }}>
            "{form.quote}"
          </div>
        )}

        <Deco type={template.deco} />

        {form.monogram && (
          <div className={`${compact ? 'text-lg' : 'text-2xl'} tracking-[0.2em] mb-2 font-light`}>
            {form.monogram}
          </div>
        )}

        <div className={`${compact ? 'text-[8px]' : 'text-[11px]'} tracking-[0.25em] uppercase mb-2 opacity-60`}>
          {form.eventType === 'חתונה' ? 'THE WEDDING' : form.eventType}
        </div>

        <div className={`${titleSize} font-serif leading-snug mb-1`}>
          {form.owners || 'שמות בעלי השמחה'}
        </div>

        <div
          className={`${compact ? 'w-8 my-2' : 'w-12 my-5'} h-px mx-auto`}
          style={{ background: template.line }}
        />

        <div className={`${compact ? 'text-[10px]' : 'text-sm'} mb-3 opacity-80`}>
          {form.inviteLine || 'הנכם מוזמנים לחגוג עמנו'}
        </div>

        <div className={`${dateSize} font-light tracking-wide mb-1`}>
          {formatDate(form.date) || '00.00.0000'}
        </div>

        {form.hebrewDate && !compact && (
          <div className="text-sm mb-3 opacity-70">{form.hebrewDate}</div>
        )}

        <div className={`${compact ? 'text-[10px] mb-2' : 'text-sm mb-5'}`}>
          {[form.hallName, form.city].filter(Boolean).join(' | ') || 'אולם | עיר'}
        </div>

        <div className={`flex justify-center ${compact ? 'gap-3 text-[9px] mb-2' : 'gap-8 text-sm mb-5'}`}>
          <div>
            <div className="opacity-60 text-[0.85em] mb-0.5">קבלת פנים</div>
            <div>{form.receptionTime || '19:30'}</div>
          </div>
          <div className="w-px self-stretch opacity-40" style={{ background: template.line }} />
          <div>
            <div className="opacity-60 text-[0.85em] mb-0.5">חופה</div>
            <div>{form.chuppahTime || '20:30'}</div>
          </div>
        </div>

        <div className={`${compact ? 'text-[10px] mb-2' : 'text-sm mb-6'} opacity-80`}>
          {form.welcomeLine || 'נשמח לראותכם'}
        </div>

        {(form.groomParents || form.brideParents) && (
          <div
            className={`flex justify-between gap-3 ${compact ? 'text-[8px]' : 'text-xs'}`}
            style={{ color: template.muted }}
          >
            <div className="flex-1 text-right">
              <div className="mb-0.5 opacity-70">הורי החתן</div>
              <div className="whitespace-pre-line">{form.groomParents || '—'}</div>
            </div>
            <div className="flex-1 text-left">
              <div className="mb-0.5 opacity-70">הורי הכלה</div>
              <div className="whitespace-pre-line">{form.brideParents || '—'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InviteBuilderPage() {
  const params = useParams();
  const eventId = String(params?.id || '');
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    try {
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const ev = events.find((e) => String(e.id) === String(eventId));
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
        welcomeLine: inv?.welcomeLine || 'נשמח לראותכם',
        inviteLine: inv?.inviteLine || 'הנכם מוזמנים לחגוג עמנו',
        groomParents: inv?.groomParents || ev?.groomParents || '',
        brideParents: inv?.brideParents || ev?.brideParents || '',
        monogram: inv?.monogram || '',
        quote: inv?.quote || '',
        hebrewDate: inv?.hebrewDate || '',
        templateId: inv?.templateId || 'classic-cream',
        showRsvpButton: inv?.showRsvpButton === true,
      }));
    } catch (e) {
      console.warn(e);
    }
  }, [eventId]);

  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === form.templateId) || TEMPLATES[0],
    [form.templateId]
  );

  const formatDate = (d) => {
    if (!d) return '';
    if (String(d).includes('/')) return String(d).replace(/\//g, '.');
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
    setTimeout(() => setSaved(false), 1800);
  };

  const copyLink = () => {
    save();
    navigator.clipboard.writeText(publicLink);
    alert('✅ לינק ההזמנה הועתק');
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-zinc-100" dir="rtl">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold">בניית הזמנה</h1>
            <p className="text-slate-500 text-sm mt-1">בחרו דוגמה מושלמת · הפרטים שלכם כבר בפנים</p>
          </div>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-sm">
            ← חזרה למוזמנים
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* שמאל: בחירה + שדות */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border shadow-sm p-5">
              <div className="font-bold mb-3">1. בחרו דוגמה</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
                {TEMPLATES.map((t) => {
                  const active = form.templateId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set('templateId', t.id)}
                      className={`rounded-2xl border-2 overflow-hidden text-right transition ${
                        active
                          ? 'border-amber-500 ring-2 ring-amber-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <InviteCard form={form} template={t} formatDate={formatDate} compact />
                      <div className="bg-white px-3 py-2 text-xs font-semibold text-slate-700 border-t">
                        {t.name}{active ? ' · נבחר ✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm p-5 space-y-2">
              <div className="font-bold mb-2">2. פרטים (נכנסים לכל הדוגמאות)</div>
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="שמות" value={form.owners} onChange={(e) => set('owners', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="ראשי תיבות" value={form.monogram} onChange={(e) => set('monogram', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="ציטוט / פסוק" value={form.quote} onChange={(e) => set('quote', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="משפט הזמנה" value={form.inviteLine} onChange={(e) => set('inviteLine', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full border rounded-xl px-3 py-2.5" placeholder="תאריך לועזי" value={form.date} onChange={(e) => set('date', e.target.value)} />
                <input className="w-full border rounded-xl px-3 py-2.5" placeholder="תאריך עברי" value={form.hebrewDate} onChange={(e) => set('hebrewDate', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full border rounded-xl px-3 py-2.5" placeholder="קבלת פנים" value={form.receptionTime} onChange={(e) => set('receptionTime', e.target.value)} />
                <input className="w-full border rounded-xl px-3 py-2.5" placeholder="חופה" value={form.chuppahTime} onChange={(e) => set('chuppahTime', e.target.value)} />
              </div>
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="אולם" value={form.hallName} onChange={(e) => set('hallName', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="עיר" value={form.city} onChange={(e) => set('city', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="משפט סיום" value={form.welcomeLine} onChange={(e) => set('welcomeLine', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="הורי החתן" value={form.groomParents} onChange={(e) => set('groomParents', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="הורי הכלה" value={form.brideParents} onChange={(e) => set('brideParents', e.target.value)} />

              <div className="flex flex-wrap gap-2 pt-3">
                <button type="button" onClick={save} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold">
                  {saved ? '✅ נשמר' : 'שמירה'}
                </button>
                <button type="button" onClick={copyLink} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold">
                  📋 העתק לינק
                </button>
                <Link href={`/invite/${eventId}`} target="_blank" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold">
                  תצוגה מלאה ↗
                </Link>
              </div>
            </div>
          </div>

          {/* ימין: תצוגה גדולה */}
          <div className="bg-white rounded-3xl border shadow-sm p-5 lg:sticky lg:top-4 h-fit">
            <div className="font-bold mb-4">תצוגה מקדימה · {template.name}</div>
            <InviteCard form={form} template={template} formatDate={formatDate} />
          </div>
        </div>
      </div>
    </div>
  );
}