// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../lib/supabase.js';
const TEMPLATES = [
  { id: 'classic-cream', name: 'קלאסי שמנת', bg: '#f7f3eb', text: '#1c1917', muted: '#57534e', line: '#d6d3d1', deco: 'none', frame: 'simple' },
  { id: 'double-frame', name: 'מסגרת כפולה', bg: '#faf8f4', text: '#1c1917', muted: '#57534e', line: '#a8a29e', deco: 'none', frame: 'double' },
  { id: 'rings', name: 'טבעות זהב', bg: '#fffbeb', text: '#422006', muted: '#92400e', line: '#fcd34d', deco: 'rings', frame: 'simple' },
  { id: 'floral-soft', name: 'פרחים רכים', bg: '#fdfcf9', text: '#365314', muted: '#4d7c0f', line: '#d9f99d', deco: 'floral', frame: 'simple' },
  { id: 'romantic-heart', name: 'רומנטי', bg: '#fff1f2', text: '#4c0519', muted: '#9f1239', line: '#fecdd3', deco: 'hearts', frame: 'simple' },
  { id: 'navy-elegant', name: 'כחול אלגנטי', bg: '#0f172a', text: '#f8fafc', muted: '#94a3b8', line: '#334155', deco: 'none', frame: 'double' },
  { id: 'olive-garden', name: 'ירוק זית', bg: '#f5f7f0', text: '#3f6212', muted: '#65a30d', line: '#bef264', deco: 'leaves', frame: 'simple' },
  { id: 'minimal-bw', name: 'מינימלי שחור', bg: '#ffffff', text: '#0a0a0a', muted: '#525252', line: '#e5e5e5', deco: 'line', frame: 'simple' },
  { id: 'vintage', name: 'וינטג׳', bg: '#faf7f2', text: '#44403c', muted: '#78716c', line: '#d6d3d1', deco: 'ornament', frame: 'double' },
  { id: 'bar-party', name: 'בר/בת שמח', bg: '#eff6ff', text: '#1e3a8a', muted: '#3b82f6', line: '#93c5fd', deco: 'stars', frame: 'simple' },
];

function Deco({ type }) {
  if (type === 'rings') return <div className="text-2xl mb-2 opacity-80">💍 💍</div>;
  if (type === 'floral') return <div className="text-lg mb-2 opacity-70">🌿 🌸 🌿</div>;
  if (type === 'hearts') return <div className="text-lg mb-2 opacity-70">♡</div>;
  if (type === 'leaves') return <div className="text-lg mb-2 opacity-70">🍃 ✨ 🍃</div>;
  if (type === 'stars') return <div className="text-lg mb-2 opacity-70">✦ ★ ✦</div>;
  if (type === 'ornament') return <div className="text-sm mb-2 tracking-[0.3em] opacity-60">❖ ❖ ❖</div>;
  if (type === 'line') return <div className="w-px h-8 mx-auto mb-3 bg-current opacity-40" />;
  return null;
}

export default function StandaloneInvitePage() {
  const params = useParams();
  const inviteId = String(params?.inviteId || '');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inviteId) return;
    try {
      const raw = localStorage.getItem(`invitation_standalone_${inviteId}`);
      if (raw) setForm(JSON.parse(raw));
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [inviteId]);

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
        <div className="text-center px-6">
          <div className="text-2xl font-bold mb-2">ההזמנה לא נמצאה</div>
          <p className="text-slate-500 text-sm">
            ייתכן שנפתחה במכשיר אחר. כרגע ההזמנות נשמרות במכשיר שיצר אותן.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ebe6dc] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div
          className="relative mx-auto shadow-2xl overflow-hidden"
          style={{
            background: template.bg,
            color: template.text,
            border:
              template.frame === 'double'
                ? `3px double ${template.line}`
                : `1px solid ${template.line}`,
          }}
        >
          <div className="absolute top-3 left-3 text-[11px] opacity-50">בס״ד</div>
          {template.deco === 'floral' && (
            <>
              <div className="absolute top-2 right-2 text-xl opacity-50">🌸</div>
              <div className="absolute bottom-2 left-2 text-xl opacity-50">🌿</div>
            </>
          )}

          <div className="px-8 pt-12 pb-10 text-center">
            {form.quote && (
              <div className="text-sm mb-4 opacity-80" style={{ color: template.muted }}>
                "{form.quote}"
              </div>
            )}
            <Deco type={template.deco} />
            {form.monogram && (
              <div className="text-2xl tracking-[0.2em] mb-2 font-light">{form.monogram}</div>
            )}
            <div className="text-[11px] tracking-[0.25em] uppercase mb-2 opacity-60">
              {form.eventType === 'חתונה' ? 'THE WEDDING' : form.eventType}
            </div>
            <div className="text-3xl sm:text-4xl font-serif leading-snug mb-1">
              {form.owners || 'בעלי השמחה'}
            </div>
            <div className="w-12 h-px mx-auto my-5" style={{ background: template.line }} />
            <div className="text-sm mb-3 opacity-80">{form.inviteLine}</div>
            <div className="text-3xl font-light mb-1">{formatDate(form.date)}</div>
            {form.hebrewDate && <div className="text-sm mb-3 opacity-70">{form.hebrewDate}</div>}
            <div className="text-sm mb-5">
              {[form.hallName, form.city].filter(Boolean).join(' | ')}
            </div>
            <div className="flex justify-center gap-8 text-sm mb-5">
              <div>
                <div className="text-xs opacity-60 mb-0.5">קבלת פנים</div>
                <div>{form.receptionTime || '19:30'}</div>
              </div>
              <div className="w-px self-stretch opacity-40" style={{ background: template.line }} />
              <div>
                <div className="text-xs opacity-60 mb-0.5">חופה</div>
                <div>{form.chuppahTime || '20:30'}</div>
              </div>
            </div>
            <div className="text-sm mb-6 opacity-80">{form.welcomeLine}</div>
            {(form.groomParents || form.brideParents) && (
              <div className="flex justify-between gap-4 text-xs" style={{ color: template.muted }}>
                <div className="flex-1 text-right">
                  <div className="mb-0.5 opacity-70">הורי החתן</div>
                  <div className="whitespace-pre-line">{form.groomParents}</div>
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-0.5 opacity-70">הורי הכלה</div>
                  <div className="whitespace-pre-line">{form.brideParents}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-stone-400 mt-5">EventPay</p>
      </div>
    </div>
  );
}