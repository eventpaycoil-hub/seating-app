// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
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
    id: 'rings-gold',
    name: 'טבעות זהב + שמפניה',
    bg: '#fffbeb',
    text: '#422006',
    muted: '#92400e',
    line: '#fcd34d',
    deco: 'rings-champagne',
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
    id: 'romantic-peach',
    name: 'רומנטי אפרסק',
    bg: '#fff7ed',
    text: '#9a3412',
    muted: '#c2410c',
    line: '#fdba74',
    deco: 'peach-floral',
    frame: 'simple',
  },
  {
    id: 'dancing-couple',
    name: 'רקדנים אלגנטי',
    bg: '#fafaf9',
    text: '#1c1917',
    muted: '#57534e',
    line: '#d6d3d1',
    deco: 'dancers',
    frame: 'simple',
  },
  {
    id: 'dark-luxury',
    name: 'יוקרה כהה',
    bg: '#0c0a09',
    text: '#fafaf9',
    muted: '#a8a29e',
    line: '#44403c',
    deco: 'ornament',
    frame: 'double',
  },
  {
    id: 'olive-garden',
    name: 'ירוק זית עשיר',
    bg: '#f5f7f0',
    text: '#3f6212',
    muted: '#65a30d',
    line: '#bef264',
    deco: 'leaves',
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
    name: 'וינטג׳ זהב',
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

function Deco({ type }) {
  if (type === 'rings-champagne') {
    return (
      <div className="flex items-center justify-center gap-3 mb-4 text-3xl opacity-90">
        <span>💍</span>
        <span className="text-2xl">🥂</span>
        <span>💍</span>
      </div>
    );
  }
  if (type === 'dancers') {
    return <div className="text-4xl mb-4 opacity-90 tracking-widest">💃 🕺</div>;
  }
  if (type === 'peach-floral') {
    return <div className="text-xl mb-3 opacity-80">🌸 🏵️ 🌸</div>;
  }
  if (type === 'rings') {
    return <div className="text-3xl mb-3 opacity-80">💍 💍</div>;
  }
  if (type === 'floral') {
    return <div className="text-xl mb-3 opacity-70">🌿 🌸 🌿</div>;
  }
  if (type === 'hearts') {
    return <div className="text-xl mb-3 opacity-70">♡</div>;
  }
  if (type === 'leaves') {
    return <div className="text-xl mb-3 opacity-70">🍃 ✨ 🍃</div>;
  }
  if (type === 'stars') {
    return <div className="text-xl mb-3 opacity-70">✦ ★ ✦</div>;
  }
  if (type === 'ornament') {
    return <div className="text-base mb-3 tracking-[0.35em] opacity-60">❖ ❖ ❖</div>;
  }
  if (type === 'line') {
    return <div className="w-px h-10 mx-auto mb-4 bg-current opacity-40" />;
  }
  return null;
}

function formatDate(d) {
  if (!d) return '';
  if (String(d).includes('/')) return String(d).replace(/\//g, '.');
  if (/^\d{4}-\d{2}-\d{2}/.test(String(d))) {
    const [y, m, day] = String(d).slice(0, 10).split('-');
    return `${day}.${m}.${y}`;
  }
  return d;
}

export default function PublicInvitePage() {
  const params = useParams();
  const eventId = String(params?.eventId || '');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      // קודם מנסה את ההזמנה השמורה
      const inv = JSON.parse(localStorage.getItem(`invitation_${eventId}`) || 'null');

      if (inv) {
        setForm(inv);
      } else {
        // fallback לאירוע עצמו
        const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
        const ev = events.find((e) => String(e.id) === String(eventId));
        if (ev) {
          setForm({
            templateId: 'classic-cream',
            owners: ev.owners || ev.title || '',
            eventType: ev.eventType || 'חתונה',
            date: ev.fullDate || ev.eventDate || ev.date || '',
            receptionTime: ev.time || '19:30',
            chuppahTime: '20:30',
            hallName: ev.hallName || '',
            city: ev.city || '',
            welcomeLine: 'נשמח לראותכם',
            inviteLine: 'הנכם מוזמנים לחגוג עמנו',
            groomParents: ev.groomParents || '',
            brideParents: ev.brideParents || '',
            monogram: '',
            quote: '',
            hebrewDate: '',
          });
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const template = useMemo(() => {
    if (!form) return TEMPLATES[0];
    return TEMPLATES.find((t) => t.id === form.templateId) || TEMPLATES[0];
  }, [form]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100" dir="rtl">
        <div className="text-lg text-stone-500">טוען הזמנה...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100" dir="rtl">
        <div className="text-center p-8">
          <div className="text-2xl font-bold mb-2">ההזמנה לא נמצאה</div>
          <div className="text-stone-500">ייתכן שהלינק לא תקין או שההזמנה עדיין לא נשמרה</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8"
      style={{ background: '#f5f0e8' }}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-[440px] shadow-2xl overflow-hidden"
        style={{
          background: template.bg,
          color: template.text,
          border:
            template.frame === 'double'
              ? `3px double ${template.line}`
              : `1px solid ${template.line}`,
        }}
      >
        {/* בס״ד */}
        <div className="absolute top-4 left-4 text-[11px] opacity-50">בס״ד</div>

        {/* פינות פרחוניות */}
        {(template.deco === 'floral' || template.deco === 'peach-floral') && (
          <>
            <div className="absolute top-3 right-3 text-xl opacity-50">🌸</div>
            <div className="absolute bottom-3 left-3 text-xl opacity-50">🌿</div>
            <div className="absolute bottom-3 right-3 text-xl opacity-50">🌸</div>
          </>
        )}

        <div className="px-8 pt-14 pb-12 text-center">
          {form.quote && (
            <div
              className="text-sm mb-5 leading-relaxed opacity-80"
              style={{ color: template.muted }}
            >
              "{form.quote}"
            </div>
          )}

          <Deco type={template.deco} />

          {form.monogram && (
            <div className="text-2xl tracking-[0.25em] mb-3 font-light opacity-90">
              {form.monogram}
            </div>
          )}

          <div className="text-[11px] tracking-[0.3em] uppercase mb-3 opacity-60">
            {form.eventType === 'חתונה' ? 'THE WEDDING' : form.eventType}
          </div>

          <div className="text-3xl sm:text-4xl font-serif leading-snug mb-2">
            {form.owners || 'שמות בעלי השמחה'}
          </div>

          <div
            className="w-14 h-px mx-auto my-6"
            style={{ background: template.line }}
          />

          <div className="text-sm mb-4 opacity-85">
            {form.inviteLine || 'הנכם מוזמנים לחגוג עמנו'}
          </div>

          <div className="text-3xl font-light tracking-wide mb-1">
            {formatDate(form.date) || '00.00.0000'}
          </div>

          {form.hebrewDate && (
            <div className="text-sm mb-4 opacity-70">{form.hebrewDate}</div>
          )}

          <div className="text-sm mb-6 opacity-90">
            {[form.hallName, form.city].filter(Boolean).join(' | ') || ''}
          </div>

          <div className="flex justify-center gap-10 text-sm mb-7">
            <div>
              <div className="opacity-60 text-xs mb-1">קבלת פנים</div>
              <div className="font-medium">{form.receptionTime || '19:30'}</div>
            </div>
            <div className="w-px self-stretch opacity-30" style={{ background: template.line }} />
            <div>
              <div className="opacity-60 text-xs mb-1">חופה</div>
              <div className="font-medium">{form.chuppahTime || '20:30'}</div>
            </div>
          </div>

          <div className="text-sm mb-8 opacity-85">
            {form.welcomeLine || 'נשמח לראותכם'}
          </div>

          {(form.groomParents || form.brideParents) && (
            <div
              className="flex justify-between gap-4 text-xs"
              style={{ color: template.muted }}
            >
              <div className="flex-1 text-right">
                <div className="mb-1 opacity-70">הורי החתן</div>
                <div className="whitespace-pre-line leading-relaxed">
                  {form.groomParents || '—'}
                </div>
              </div>
              <div className="flex-1 text-left">
                <div className="mb-1 opacity-70">הורי הכלה</div>
                <div className="whitespace-pre-line leading-relaxed">
                  {form.brideParents || '—'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}