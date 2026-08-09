// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const TEMPLATES = [
  { id: 'classic-cream', bg: '#f7f3eb', text: '#1c1917', muted: '#57534e', line: '#d6d3d1', frame: 'simple' },
  { id: 'double-frame', bg: '#faf8f4', text: '#1c1917', muted: '#57534e', line: '#a8a29e', frame: 'double' },
  { id: 'rings-gold', bg: '#fffbeb', text: '#422006', muted: '#92400e', line: '#fcd34d', frame: 'simple' },
  { id: 'floral-soft', bg: '#fdfcf9', text: '#365314', muted: '#4d7c0f', line: '#d9f99d', frame: 'simple' },
  { id: 'romantic-peach', bg: '#fff7ed', text: '#9a3412', muted: '#c2410c', line: '#fdba74', frame: 'simple' },
  { id: 'dancing-couple', bg: '#fafaf9', text: '#1c1917', muted: '#57534e', line: '#d6d3d1', frame: 'simple' },
  { id: 'dark-luxury', bg: '#0c0a09', text: '#fafaf9', muted: '#a8a29e', line: '#44403c', frame: 'double' },
  { id: 'olive-garden', bg: '#f5f7f0', text: '#3f6212', muted: '#65a30d', line: '#bef264', frame: 'simple' },
  { id: 'navy-elegant', bg: '#0f172a', text: '#f8fafc', muted: '#94a3b8', line: '#334155', frame: 'double' },
  { id: 'minimal-bw', bg: '#ffffff', text: '#0a0a0a', muted: '#525252', line: '#e5e5e5', frame: 'simple' },
  { id: 'vintage', bg: '#faf7f2', text: '#44403c', muted: '#78716c', line: '#d6d3d1', frame: 'double' },
  { id: 'bar-party', bg: '#eff6ff', text: '#1e3a8a', muted: '#3b82f6', line: '#93c5fd', frame: 'simple' },
  { id: 'botanical-sage', bg: '#f5f0e6', text: '#3f2a1e', muted: '#6b5c4c', line: '#c4a574', frame: 'double' },
  { id: 'soft-emboss', bg: '#faf9f7', text: '#5c5346', muted: '#8a8070', line: '#e8e4dc', frame: 'simple' },
  { id: 'line-floral', bg: '#ffffff', text: '#1a1a1a', muted: '#525252', line: '#d4d4d4', frame: 'simple' },
  { id: 'deckle-white', bg: '#f7f7f5', text: '#2c2c2c', muted: '#6b6b6b', line: '#d0d0d0', frame: 'simple' },
  { id: 'bar-brown', bg: '#faf6f1', text: '#5c4033', muted: '#8b6914', line: '#c4a484', frame: 'double' },
  { id: 'bat-eucalyptus', bg: '#f7faf7', text: '#2d5a3d', muted: '#5a8f6d', line: '#d4af37', frame: 'simple' },
  { id: 'formal-ivory', bg: '#f8f5f0', text: '#3d3d3d', muted: '#6b6b6b', line: '#c9c0b0', frame: 'double' },
  { id: 'romantic-script', bg: '#faf8f6', text: '#3f2a1e', muted: '#7c6a58', line: '#e7d5c4', frame: 'simple' },
  { id: 'brit-sky', bg: '#f0f9ff', text: '#0c4a6e', muted: '#0369a1', line: '#7dd3fc', frame: 'simple' },
  { id: 'brit-cream', bg: '#fffbeb', text: '#78350f', muted: '#a16207', line: '#fde68a', frame: 'double' },
  { id: 'birthday-fun', bg: '#fdf4ff', text: '#86198f', muted: '#c026d3', line: '#f0abfc', frame: 'simple' },
  { id: 'ornate-cream', bg: '#fbf8f1', text: '#6b5c3e', muted: '#9a8b6e', line: '#c4a574', frame: 'ornate' },
  { id: 'wildflower-white', bg: '#fffcf9', text: '#3d3d3d', muted: '#7a7a7a', line: '#e8e0d8', frame: 'simple' },
  { id: 'mono-clean', bg: '#ffffff', text: '#1a1a1a', muted: '#6b6b6b', line: '#d4d4d4', frame: 'simple' },
  { id: 'vellum-soft', bg: '#f7f4ef', text: '#4a433a', muted: '#8a8070', line: '#d6cfc4', frame: 'double' },
  { id: 'brit-sand', bg: '#faf6f0', text: '#5c4a3a', muted: '#8b7355', line: '#e0d5c5', frame: 'simple' },
  { id: 'brit-sky-soft', bg: '#f3f8fc', text: '#3d5a73', muted: '#6b8fa3', line: '#c5d9e8', frame: 'simple' },
  { id: 'brit-check', bg: '#f7f5f0', text: '#5c5346', muted: '#8a8070', line: '#d4cfc4', frame: 'simple' },
  { id: 'bar-navy-formal', bg: '#f8f9fb', text: '#1e3a5f', muted: '#4a6fa5', line: '#c5d0e0', frame: 'double' },
  { id: 'bar-stone', bg: '#f5f2ec', text: '#3f3a32', muted: '#7a7268', line: '#d0c8b8', frame: 'simple' },
  { id: 'bat-blush', bg: '#fdf8f6', text: '#6b4545', muted: '#a67c7c', line: '#e8d0d0', frame: 'simple' },
  { id: 'bat-gold-floral', bg: '#fffdf9', text: '#5c4033', muted: '#8b6914', line: '#e8d5a3', frame: 'simple' },
  { id: 'bat-mint', bg: '#f5faf7', text: '#3d5c4a', muted: '#6b9a7a', line: '#c5e0d0', frame: 'simple' },
];

const BACKGROUNDS = [
  { id: 'none', src: '' },
  { id: 'blush-gold', src: '/invite-backgrounds/bg-blush-gold.png' },
  { id: 'navy-moon', src: '/invite-backgrounds/bg-navy-moon.png' },
  { id: 'sage-leaves', src: '/invite-backgrounds/bg-sage-leaves.png' },
  { id: 'cream-silk', src: '/invite-backgrounds/bg-cream-silk.png' },
  { id: 'pink-circle', src: '/invite-backgrounds/bg-pink-circle.png' },
  { id: 'navy-stars', src: '/invite-backgrounds/bg-navy-stars.png' },
  { id: 'stars', src: '/invite-backgrounds/stars.png' },
];

const FRAMES = [
  { id: 'none', src: '' },
  { id: 'rose-gold', src: '/invite-frames/frame-rose-gold.png' },
  { id: 'green-wreath', src: '/invite-frames/frame-green-wreath.png' },
  { id: 'purple-wash', src: '/invite-frames/frame-purple-wash.png' },
  { id: 'eucalyptus', src: '/invite-frames/frame-eucalyptus.png' },
  { id: 'pink-arch', src: '/invite-frames/frame-pink-arch.png' },
  { id: 'navy-stars', src: '/invite-frames/frame-navy-stars.png' },
  { id: 'gold-classic', src: '/invite-frames/frame-gold-classic.png' },
  { id: 'peach-floral', src: '/invite-frames/frame-peach-floral.png' },
  { id: 'purple-wreath', src: '/invite-frames/frame-purple-wreath.png' },
  { id: 'gold', src: '/invite-frames/frame-gold.png' },
  { id: 'blue-ornate', src: '/invite-frames/frame-blue-ornate.png' },
  { id: 'navy-frame', src: '/invite-frames/frame-navy.png' },
  { id: 'black-ornate', src: '/invite-frames/frame-black-ornate.png' },
  { id: 'gold-simple', src: '/invite-frames/frame-gold-simple.png' },
  { id: 'gold-ornate', src: '/invite-frames/frame-gold-ornate.png' },
];

const OBJECTS = [
  { id: 'rings', src: '/invite-objects/rings.png' },
  { id: 'rings-engraved', src: '/invite-objects/rings-engraved.png' },
  { id: 'rings-thin', src: '/invite-objects/rings-thin.png' },
  { id: 'champagne', src: '/invite-objects/champagne.png' },
  { id: 'dancers', src: '/invite-objects/dancers.png' },
  { id: 'flowers', src: '/invite-objects/flowers.png' },
  { id: 'flowers-soft', src: '/invite-objects/flowers-soft.png' },
  { id: 'leaves', src: '/invite-objects/leaves.png' },
  { id: 'leaves-gold', src: '/invite-objects/leaves-gold.png' },
  { id: 'wreath-pink', src: '/invite-objects/wreath-pink.png' },
  { id: 'doves', src: '/invite-objects/doves.png' },
  { id: 'candles', src: '/invite-objects/candles.png' },
  { id: 'mask', src: '/invite-objects/mask.png' },
  { id: 'bowtie', src: '/invite-objects/bowtie.png' },
  { id: 'soccer', src: '/invite-objects/soccer.png' },
  { id: 'surfboard', src: '/invite-objects/surfboard.png' },
  { id: 'piano', src: '/invite-objects/piano.png' },
  { id: 'teddy', src: '/invite-objects/teddy.png' },
  { id: 'bunny', src: '/invite-objects/bunny.png' },
  { id: 'cradle', src: '/invite-objects/cradle.png' },
  { id: 'balloon', src: '/invite-objects/balloon.png' },
  { id: 'baby-bottle', src: '/invite-objects/baby-bottle.png' },
  { id: 'jerusalem', src: '/invite-objects/jerusalem.png' },
  { id: 'tallit', src: '/invite-objects/tallit.png' },
];

function formatDate(d) {
  if (!d) return '';
  if (String(d).includes('/')) return String(d).replace(/\//g, '.');
  if (/^\d{4}-\d{2}-\d{2}/.test(String(d))) {
    const [y, m, day] = String(d).slice(0, 10).split('-');
    return `${day}.${m}.${y}`;
  }
  return d;
}

function ObjectsDisplay({ selected, position }) {
  const list = (selected || []).filter((o) => o.position === position);
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-5 mb-5">
      {list.map((item) => {
        const obj = OBJECTS.find((o) => o.id === item.id);
        if (!obj) return null;
        return (
          <img
            key={`${item.id}-${position}`}
            src={obj.src}
            alt=""
            className="object-contain"
            style={{ maxHeight: 90, maxWidth: 110, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        );
      })}
    </div>
  );
}

export default function PublicInvitePage() {
  const params = useParams();
  const eventId = String(params?.eventId || params?.id || '');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    try {
      const inv = JSON.parse(localStorage.getItem(`invitation_${eventId}`) || 'null');
      if (inv) {
        let selectedObjects = inv.selectedObjects || [];
        if (Array.isArray(selectedObjects) && typeof selectedObjects[0] === 'string') {
          selectedObjects = selectedObjects.map((id) => ({ id, position: 'top' }));
        }
        setForm({ ...inv, selectedObjects });
      } else {
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
            monogramColor: '',
            textColor: '',
            quote: '',
            hebrewDate: '',
            photoUrl: '',
            customBg: '',
            bgId: 'none',
            frameId: 'none',
            frameScaleX: 1,
            frameScaleY: 1,
            selectedObjects: [],
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
          <div className="text-stone-500 mb-6">ייתכן שהלינק לא תקין או שההזמנה עדיין לא נשמרה</div>
          {eventId && (
            <Link href={`/event/${eventId}/invite-builder`} className="text-blue-600 hover:underline">
              ← חזרה לעריכת הזמנה
            </Link>
          )}
        </div>
      </div>
    );
  }

  const isWedding = form.eventType === 'חתונה';
  const isBarBat = form.eventType === 'בר מצווה' || form.eventType === 'בת מצווה';
  const textColor = form.textColor || template.text;
  const monoColor =
    form.monogramColor ||
    (template.line && template.line !== '#e5e5e5' ? template.line : template.text);

  const bgSrc =
    form.bgId && form.bgId !== 'none'
      ? BACKGROUNDS.find((b) => b.id === form.bgId)?.src
      : '';
  const frameSrc =
    form.frameId && form.frameId !== 'none'
      ? FRAMES.find((f) => f.id === form.frameId)?.src
      : '';
  const bgColor =
    form.customBg && form.customBg.startsWith('#')
      ? form.customBg
      : template.bg;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8 relative"
      style={{ background: '#f5f0e8' }}
      dir="rtl"
    >
      <Link
        href={`/event/${eventId}/invite-builder`}
        className="fixed top-4 right-4 z-50 bg-white/95 border border-stone-200 shadow-md px-4 py-2.5 rounded-xl text-sm font-medium text-stone-800 hover:bg-white hover:shadow-lg transition"
      >
        ← חזרה לעריכה
      </Link>

      <div className="w-full flex justify-center">
        <div
          className="relative w-full max-w-[440px] shadow-2xl overflow-hidden"
          style={{
            backgroundColor: bgColor,
            backgroundImage: bgSrc
              ? `url(${bgSrc})`
              : form.customBg && !form.customBg.startsWith('#')
              ? `url(${form.customBg})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: textColor,
            border:
              template.frame === 'double'
                ? `3px double ${template.line}`
                : template.frame === 'ornate'
                ? `2px solid ${template.line}`
                : `1px solid ${template.line}`,
            boxShadow:
              template.frame === 'ornate'
                ? `inset 0 0 0 6px ${template.bg}, inset 0 0 0 7px ${template.line}`
                : undefined,
          }}
        >
          {frameSrc && (
            <img
              src={frameSrc}
              alt=""
              className="pointer-events-none absolute inset-0 w-full h-full"
              style={{
                zIndex: 5,
                objectFit: 'contain',
                transform: `scale(${form.frameScaleX || 1}, ${form.frameScaleY || 1})`,
                transformOrigin: 'center center',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          <div className="relative" style={{ zIndex: 10 }}>
            <div className="absolute top-4 left-4 text-[11px] opacity-50">בס״ד</div>

            <div className="px-8 pt-14 pb-12 text-center">
              {form.quote && (
                <div className="text-sm mb-5 leading-relaxed opacity-80" style={{ color: form.textColor || template.muted }}>
                  "{form.quote}"
                </div>
              )}

              <ObjectsDisplay selected={form.selectedObjects} position="top" />

              {form.monogram && (
                <div
                  className="text-5xl tracking-[0.15em] mb-4 font-serif"
                  style={{ color: monoColor }}
                >
                  {form.monogram}
                </div>
              )}

              {isBarBat && form.photoUrl && (
                <div className="mb-5 flex justify-center">
                  <img
                    src={form.photoUrl}
                    alt=""
                    className="w-28 h-28 object-cover rounded-full border-2 shadow"
                    style={{ borderColor: template.line }}
                  />
                </div>
              )}

              <div className="text-[11px] tracking-[0.3em] uppercase mb-3 opacity-60">
                {form.eventType === 'חתונה'
                  ? 'THE WEDDING'
                  : form.eventType === 'בר מצווה'
                  ? 'BAR MITZVAH'
                  : form.eventType === 'בת מצווה'
                  ? 'BAT MITZVAH'
                  : form.eventType || 'אירוע'}
              </div>

              <div className="text-3xl sm:text-4xl font-serif leading-snug mb-2">
                {form.owners || 'שמות בעלי השמחה'}
              </div>

              <div className="w-14 h-px mx-auto my-6" style={{ background: template.line }} />

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

              {isWedding ? (
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
              ) : (
                <div className="text-sm mb-7">
                  <div className="opacity-60 text-xs mb-1">שעת התחלה</div>
                  <div className="font-medium">{form.receptionTime || '19:30'}</div>
                </div>
              )}

              <div className="text-sm mb-8 opacity-85">
                {form.welcomeLine || 'נשמח לראותכם'}
              </div>

              <ObjectsDisplay selected={form.selectedObjects} position="bottom" />

              {isWedding && (form.groomParents || form.brideParents) && (
                <div className="flex justify-between gap-4 text-xs" style={{ color: form.textColor || template.muted }}>
                  <div className="flex-1 text-right">
                    <div className="mb-1 opacity-70">הורי החתן</div>
                    <div className="whitespace-pre-line leading-relaxed">{form.groomParents || '—'}</div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="mb-1 opacity-70">הורי הכלה</div>
                    <div className="whitespace-pre-line leading-relaxed">{form.brideParents || '—'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}