// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

const TEMPLATES = [
  {
    id: 'classic-cream',
    bg: '#f7f3eb',
    text: '#1c1917',
    muted: '#57534e',
    line: '#d6d3d1',
  },
  {
    id: 'modern-dark',
    bg: '#1c1917',
    text: '#fafaf9',
    muted: '#a8a29e',
    line: '#44403c',
  },
  {
    id: 'romantic',
    bg: '#fff1f2',
    text: '#4c0519',
    muted: '#9f1239',
    line: '#fecdd3',
  },
  {
    id: 'floral',
    bg: '#f7faf5',
    text: '#365314',
    muted: '#4d7c0f',
    line: '#d9f99d',
  },
  {
    id: 'emerald',
    bg: '#ecfdf5',
    text: '#064e3b',
    muted: '#047857',
    line: '#a7f3d0',
  },
];

export default function PublicInvitePage() {
  const params = useParams();
  const eventId = String(params?.eventId || '');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    try {
      const inv = JSON.parse(localStorage.getItem(`invitation_${eventId}`) || 'null');
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const ev = events.find((e) => String(e.id) === String(eventId));

      if (inv) {
        setForm(inv);
      } else if (ev) {
        setForm({
          templateId: 'classic-cream',
          owners: ev.owners || ev.title || '',
          eventType: ev.eventType || 'חתונה',
          date: ev.fullDate || ev.eventDate || ev.date || '',
          receptionTime: ev.time || '19:30',
          chuppahTime: '20:30',
          hallName: ev.hallName || '',
          city: ev.city || '',
          welcomeLine: ev.welcomeLine || 'נשמח לראותכם',
          groomParents: ev.groomParents || '',
          brideParents: ev.brideParents || '',
          showRsvpButton: false,
        });
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const template = useMemo(() => {
    const id = form?.templateId || 'classic-cream';
    return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
  }, [form?.templateId]);

  const formatDate = (d) => {
    if (!d) return '';
    if (String(d).includes('/')) return String(d).replace(/\//g, '.');
    if (/^\d{4}-\d{2}-\d{2}/.test(String(d))) {
      const [y, m, day] = String(d).slice(0, 10).split('-');
      return `${day}.${m}.${y}`;
    }
    return d;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ebe6dc]" dir="rtl">
        טוען הזמנה...
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ebe6dc]" dir="rtl">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">לא נמצאה הזמנה</div>
          <p className="text-slate-500">ייתכן שעדיין לא נבנתה הזמנה לאירוע זה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ebe6dc] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div
          className="relative shadow-2xl border overflow-hidden"
          style={{
            background: template.bg,
            color: template.text,
            borderColor: template.line,
          }}
        >
          <div className="absolute top-4 left-4 text-[11px] opacity-50">בס״ד</div>

          <div className="px-8 pt-14 pb-12 text-center">
            {form.quote && (
              <div
                className="text-sm mb-5 leading-relaxed opacity-80"
                style={{ color: template.muted }}
              >
                "{form.quote}"
              </div>
            )}

            {form.monogram && (
              <div className="text-3xl tracking-[0.2em] mb-3 font-light">
                {form.monogram}
              </div>
            )}

            <div className="text-[11px] tracking-[0.3em] uppercase mb-4 opacity-60">
              {form.eventType === 'חתונה' ? 'THE WEDDING' : form.eventType}
            </div>

            <div className="text-3xl sm:text-4xl font-serif leading-snug mb-2">
              {form.owners || 'בעלי השמחה'}
            </div>

            <div
              className="w-12 h-px mx-auto my-6"
              style={{ background: template.line }}
            />

            <div className="text-sm mb-5" style={{ color: template.muted }}>
              הנכם מוזמנים לחגוג עמנו
            </div>

            <div className="text-3xl font-light tracking-wide mb-1">
              {formatDate(form.date)}
            </div>

            {form.hebrewDate && (
              <div className="text-sm mb-4 opacity-70">{form.hebrewDate}</div>
            )}

            <div className="text-sm mb-6">
              {[form.hallName, form.city].filter(Boolean).join(' | ')}
            </div>

            <div className="flex justify-center gap-8 text-sm mb-6">
              <div>
                <div className="text-xs opacity-60 mb-1">קבלת פנים</div>
                <div>{form.receptionTime || form.time || '19:30'}</div>
              </div>
              <div
                className="w-px self-stretch"
                style={{ background: template.line }}
              />
              <div>
                <div className="text-xs opacity-60 mb-1">חופה וקידושין</div>
                <div>{form.chuppahTime || '20:30'}</div>
              </div>
            </div>

            <div className="text-sm mb-8 opacity-80">{form.welcomeLine}</div>

            {(form.groomParents || form.brideParents) && (
              <div
                className="flex justify-between gap-6 text-xs"
                style={{ color: template.muted }}
              >
                <div className="flex-1 text-right">
                  <div className="mb-1 opacity-70">הורי החתן</div>
                  <div className="whitespace-pre-line">{form.groomParents}</div>
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-1 opacity-70">הורי הכלה</div>
                  <div className="whitespace-pre-line">{form.brideParents}</div>
                </div>
              </div>
            )}

            {form.showRsvpButton && (
              <div className="mt-10">
                <a
                  href={`/landing?eventId=${eventId}`}
                  className="inline-block px-8 py-3 rounded-full text-sm font-medium border"
                  style={{ borderColor: template.line, color: template.text }}
                >
                  לאישור הגעה
                </a>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-stone-400 mt-5">EventPay</p>
      </div>
    </div>
  );
}