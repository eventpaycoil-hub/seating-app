// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const TEMPLATES = [
  { id: 'classic-cream', name: 'קלאסי שמנת', bg: '#f7f3eb', text: '#1c1917', muted: '#57534e', line: '#d6d3d1', frame: 'simple' },
  { id: 'double-frame', name: 'מסגרת כפולה', bg: '#faf8f4', text: '#1c1917', muted: '#57534e', line: '#a8a29e', frame: 'double' },
  { id: 'rings-gold', name: 'טבעות זהב', bg: '#fffbeb', text: '#422006', muted: '#92400e', line: '#fcd34d', frame: 'simple' },
  { id: 'floral-soft', name: 'פרחים רכים', bg: '#fdfcf9', text: '#365314', muted: '#4d7c0f', line: '#d9f99d', frame: 'simple' },
  { id: 'romantic-peach', name: 'רומנטי אפרסק', bg: '#fff7ed', text: '#9a3412', muted: '#c2410c', line: '#fdba74', frame: 'simple' },
  { id: 'dancing-couple', name: 'רקדנים אלגנטי', bg: '#fafaf9', text: '#1c1917', muted: '#57534e', line: '#d6d3d1', frame: 'simple' },
  { id: 'dark-luxury', name: 'יוקרה כהה', bg: '#0c0a09', text: '#fafaf9', muted: '#a8a29e', line: '#44403c', frame: 'double' },
  { id: 'olive-garden', name: 'ירוק זית', bg: '#f5f7f0', text: '#3f6212', muted: '#65a30d', line: '#bef264', frame: 'simple' },
  { id: 'navy-elegant', name: 'כחול אלגנטי', bg: '#0f172a', text: '#f8fafc', muted: '#94a3b8', line: '#334155', frame: 'double' },
  { id: 'minimal-bw', name: 'מינימלי שחור', bg: '#ffffff', text: '#0a0a0a', muted: '#525252', line: '#e5e5e5', frame: 'simple' },
  { id: 'vintage', name: 'וינטג׳', bg: '#faf7f2', text: '#44403c', muted: '#78716c', line: '#d6d3d1', frame: 'double' },
  { id: 'bar-party', name: 'בר/בת שמח', bg: '#eff6ff', text: '#1e3a8a', muted: '#3b82f6', line: '#93c5fd', frame: 'simple' },
  { id: 'img-gold-frame', name: 'מסגרת זהב יוקרתית', bg: "url('/invite-backgrounds/bg-gold-frame.jpg') center/cover no-repeat", text: '#f8fafc', muted: '#e2e8f0', line: '#fbbf24', frame: 'simple' },
  { id: 'img-bokeh', name: 'בוקה זהוב', bg: "url('/invite-backgrounds/bg-bokeh.jpg') center/cover no-repeat", text: '#f8fafc', muted: '#e2e8f0', line: '#fbbf24', frame: 'simple' },
  { id: 'img-simple-frame', name: 'מסגרת זהב פשוטה', bg: "url('/invite-backgrounds/bg-simple-frame.jpg') center/cover no-repeat", text: '#f8fafc', muted: '#e2e8f0', line: '#fbbf24', frame: 'simple' },
];

const OBJECTS = [
  { id: 'rings', label: 'טבעות זהב', src: '/invite-objects/rings.png' },
  { id: 'rings-engraved', label: 'טבעות עם חריטה', src: '/invite-objects/rings-engraved.png' },
  { id: 'champagne', label: 'כוסות שמפניה', src: '/invite-objects/champagne.png' },
  { id: 'dancers', label: 'רקדנים', src: '/invite-objects/dancers.png' },
  { id: 'flowers', label: 'פרחים', src: '/invite-objects/flowers.png' },
  { id: 'leaves', label: 'עלים ירוקים', src: '/invite-objects/leaves.png' },
  { id: 'doves', label: 'יונים', src: '/invite-objects/doves.png' },
  { id: 'candles', label: 'נרות', src: '/invite-objects/candles.png' },
  { id: 'mask', label: 'מסכה', src: '/invite-objects/mask.png' },
  { id: 'bowtie', label: 'פפיון', src: '/invite-objects/bowtie.png' },
  { id: 'soccer', label: 'כדורגל', src: '/invite-objects/soccer.png' },
  { id: 'surfboard', label: 'גלשן', src: '/invite-objects/surfboard.png' },
  { id: 'piano', label: 'פסנתר', src: '/invite-objects/piano.png' },
];

const PRESETS = [
  {
    id: 'or-shai-style',
    name: 'אור & שי',
    desc: 'קלאסי נקי · טבעות + שמפניה',
    templateId: 'classic-cream',
    selectedObjects: [
      { id: 'rings', position: 'top' },
      { id: 'champagne', position: 'top' },
    ],
  },
  {
    id: 'moshe-mikaela-style',
    name: 'משה & מיכאלה',
    desc: 'פרחוני רך · פרחים + טבעות + שמפניה',
    templateId: 'romantic-peach',
    selectedObjects: [
      { id: 'flowers', position: 'top' },
      { id: 'rings', position: 'top' },
      { id: 'champagne', position: 'top' },
    ],
  },
  {
    id: 'harel-hodaya',
    name: 'הראל & הודיה',
    desc: 'מינימלי נקי · טבעות + שמפניה',
    templateId: 'classic-cream',
    selectedObjects: [
      { id: 'rings', position: 'top' },
      { id: 'champagne', position: 'top' },
    ],
  },
  {
    id: 'minimal-classic',
    name: 'קלאסי מינימלי',
    desc: 'נקי · טבעות במרכז',
    templateId: 'minimal-bw',
    selectedObjects: [{ id: 'rings', position: 'top' }],
  },
  {
    id: 'floral-romantic',
    name: 'פרחוני רומנטי',
    desc: 'פרחים למעלה ולמטה',
    templateId: 'floral-soft',
    selectedObjects: [
      { id: 'flowers', position: 'top' },
      { id: 'flowers', position: 'bottom' },
    ],
  },
  {
    id: 'green-natural',
    name: 'ירוק טבעי',
    desc: 'עלים ירוקים',
    templateId: 'olive-garden',
    selectedObjects: [
      { id: 'leaves', position: 'top' },
      { id: 'leaves', position: 'bottom' },
    ],
  },
  {
    id: 'dancers-elegant',
    name: 'רקדנים אלגנטי',
    desc: 'רקדנים + טבעות',
    templateId: 'dancing-couple',
    selectedObjects: [
      { id: 'dancers', position: 'top' },
      { id: 'rings', position: 'top' },
    ],
  },
  {
    id: 'big-rings',
    name: 'טבעות גדולות',
    desc: 'טבעות בתחתית',
    templateId: 'classic-cream',
    selectedObjects: [{ id: 'rings', position: 'bottom' }],
  },
  {
    id: 'bat-mitzvah-pink',
    name: 'בת מצווה ורוד',
    desc: 'סגנון שמח · פרחים',
    templateId: 'romantic-peach',
    selectedObjects: [
      { id: 'flowers', position: 'top' },
      { id: 'flowers', position: 'bottom' },
    ],
  },
  {
    id: 'bar-mitzvah',
    name: 'בר מצווה קלאסי',
    desc: 'מכובד ונקי',
    templateId: 'minimal-bw',
    selectedObjects: [{ id: 'bowtie', position: 'top' }],
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
  selectedObjects: [
    { id: 'rings', position: 'top' },
    { id: 'flowers', position: 'top' },
  ],
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function ObjectsDisplay({ selected, position }) {
  const list = (selected || []).filter((o) => o.position === position);
  if (list.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-5 mb-5">
      {list.map((item) => {
        const obj = OBJECTS.find((o) => o.id === item.id);
        if (!obj) return null;
        const isLarge = ['rings', 'rings-engraved', 'champagne', 'dancers'].includes(obj.id);
        const size = isLarge ? 110 : 80;
        return (
          <img
            key={item.id}
            src={obj.src}
            alt={obj.label}
            className="object-contain"
            style={{
              maxHeight: size,
              maxWidth: size + 20,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
            }}
          />
        );
      })}
    </div>
  );
}

function InviteCard({ form, template, formatDate, compact = false, customBg = '' }) {
  const pad = compact ? 'px-4 pt-8 pb-5' : 'px-8 pt-12 pb-10';
  const titleSize = compact ? 'text-base' : 'text-3xl sm:text-4xl';
  const dateSize = compact ? 'text-xl' : 'text-3xl';
  const isWedding = form.eventType === 'חתונה';

  return (
    <div
      className="relative mx-auto w-full shadow-xl overflow-hidden"
      style={{
        background: customBg || template.bg,
        color: template.text,
        maxWidth: compact ? 280 : 420,
        border: template.frame === 'double' ? `3px double ${template.line}` : `1px solid ${template.line}`,
      }}
    >
      <div className={`absolute ${compact ? 'top-1.5 left-1.5 text-[8px]' : 'top-3 left-3 text-[11px]'} opacity-50`}>
        בס״ד
      </div>

      <div className={`${pad} text-center`}>
        {form.quote && !compact && (
          <div className="text-sm mb-4 leading-relaxed opacity-80" style={{ color: template.muted }}>
            "{form.quote}"
          </div>
        )}

        <ObjectsDisplay selected={form.selectedObjects} position="top" />

        {form.monogram && (
          <div className={`${compact ? 'text-lg' : 'text-2xl'} tracking-[0.2em] mb-2 font-light`}>
            {form.monogram}
          </div>
        )}

        <div className={`${compact ? 'text-[8px]' : 'text-[11px]'} tracking-[0.25em] uppercase mb-2 opacity-60`}>
          {(() => {
            const map = {
              חתונה: 'THE WEDDING',
              חינה: 'THE HENNA',
              'מסיבת רווקים': 'BACHELOR PARTY',
              'מסיבת רווקות': 'BACHELORETTE PARTY',
              'בר מצווה': 'BAR MITZVAH',
              'בת מצווה': 'BAT MITZVAH',
              ברית: 'BRIT',
              בריתה: 'BRITA',
              'יום הולדת': 'BIRTHDAY',
              אחר: 'CELEBRATION',
            };
            return map[form.eventType] || form.eventType || 'THE WEDDING';
          })()}
        </div>

        <div className={`${titleSize} font-serif leading-snug mb-1`}>
          {form.owners || 'שמות בעלי השמחה'}
        </div>

        <div className={`${compact ? 'w-8 my-2' : 'w-12 my-5'} h-px mx-auto`} style={{ background: template.line }} />

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

        {isWedding ? (
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
        ) : (
          <div className={`${compact ? 'text-[10px] mb-2' : 'text-sm mb-5'}`}>
            <div className="opacity-60 text-[0.85em] mb-0.5">שעת התחלה</div>
            <div>{form.receptionTime || '19:30'}</div>
          </div>
        )}

        <div className={`${compact ? 'text-[10px] mb-2' : 'text-sm mb-6'} opacity-80`}>
          {form.welcomeLine || 'נשמח לראותכם'}
        </div>

        <ObjectsDisplay selected={form.selectedObjects} position="bottom" />

        {isWedding && (form.groomParents || form.brideParents) && (
          <div className={`flex justify-between gap-3 ${compact ? 'text-[8px]' : 'text-xs'}`} style={{ color: template.muted }}>
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
  const [customBg, setCustomBg] = useState('');
  const [makingVideo, setMakingVideo] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    try {
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const ev = events.find((e) => String(e.id) === String(eventId));
      const inv = JSON.parse(localStorage.getItem(`invitation_${eventId}`) || 'null');

      let selectedObjects = inv?.selectedObjects || [
        { id: 'rings', position: 'top' },
        { id: 'flowers', position: 'top' },
      ];
      if (Array.isArray(selectedObjects) && typeof selectedObjects[0] === 'string') {
        selectedObjects = selectedObjects.map((id) => ({ id, position: 'top' }));
      }

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
        selectedObjects,
      }));

      if (inv?.customBg) setCustomBg(inv.customBg);
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
    localStorage.setItem(`invitation_${eventId}`, JSON.stringify({ ...form, customBg }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const copyLink = () => {
    save();
    navigator.clipboard.writeText(publicLink);
    alert('✅ לינק ההזמנה הועתק');
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleObject = (id) => {
    setForm((prev) => {
      const current = prev.selectedObjects || [];
      const exists = current.find((o) => o.id === id);
      if (exists) {
        return { ...prev, selectedObjects: current.filter((o) => o.id !== id) };
      }
      return { ...prev, selectedObjects: [...current, { id, position: 'top' }] };
    });
  };

  const setObjectPosition = (id, position) => {
    setForm((prev) => ({
      ...prev,
      selectedObjects: (prev.selectedObjects || []).map((o) =>
        o.id === id ? { ...o, position } : o
      ),
    }));
  };

  const applyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      templateId: preset.templateId,
      selectedObjects: preset.selectedObjects,
    }));
    setCustomBg('');
  };

  const makeVideo = async () => {
    if (makingVideo) return;
    setMakingVideo(true);
    save();

    let audioEl = null;

    try {
      const W = 720;
      const H = 1280;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      const isWedding = form.eventType === 'חתונה';
      const textColor = template.text || '#f8fafc';
      const mutedColor = template.muted || '#e2e8f0';
      const lineColor = template.line || '#fbbf24';

      // רקע
      let bgImg = null;
      const rawBg = customBg || template.bg || '#0f172a';
      const bgUrlMatch = String(rawBg).match(/url\(['"]?(.*?)['"]?\)/);
      if (bgUrlMatch?.[1]) {
        try {
          bgImg = await loadImage(bgUrlMatch[1]);
        } catch (e) {
          console.warn('bg image failed', e);
        }
      }
      const solidBg = String(rawBg).startsWith('#') ? rawBg : '#0f172a';

      // אובייקטים
      const topObjs = (form.selectedObjects || []).filter((o) => o.position === 'top');
      const bottomObjs = (form.selectedObjects || []).filter((o) => o.position === 'bottom');
      const loadedTop = [];
      const loadedBottom = [];
      for (const item of topObjs) {
        const obj = OBJECTS.find((o) => o.id === item.id);
        if (!obj) continue;
        try {
          loadedTop.push(await loadImage(obj.src));
        } catch {}
      }
      for (const item of bottomObjs) {
        const obj = OBJECTS.find((o) => o.id === item.id);
        if (!obj) continue;
        try {
          loadedBottom.push(await loadImage(obj.src));
        } catch {}
      }

      // מוזיקה (אופציונלי)
      try {
        audioEl = new Audio('/invite-music/upbeat.mp3');
        audioEl.loop = true;
        audioEl.volume = 0.55;
        await audioEl.play();
      } catch {
        audioEl = null; // אין קובץ / נחסם — ממשיכים בלי מוזיקה
      }

      const drawFrame = (step) => {
        if (bgImg) {
          const scale = Math.max(W / bgImg.width, H / bgImg.height);
          const iw = bgImg.width * scale;
          const ih = bgImg.height * scale;
          ctx.drawImage(bgImg, (W - iw) / 2, (H - ih) / 2, iw, ih);
        } else {
          ctx.fillStyle = solidBg;
          ctx.fillRect(0, 0, W, H);
        }

        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        let y = 120;

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = textColor;
        ctx.font = '18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('בס״ד', 40, 50);
        ctx.textAlign = 'center';
        ctx.globalAlpha = 1;

        if (step >= 1 && loadedTop.length) {
          const size = 100;
          const totalW = loadedTop.length * (size + 20);
          let x = (W - totalW) / 2 + 10;
          loadedTop.forEach((img) => {
            ctx.drawImage(img, x, y, size, size);
            x += size + 20;
          });
          y += size + 30;
        }

        if (step >= 2) {
          ctx.fillStyle = mutedColor;
          ctx.font = '16px Arial';
          ctx.globalAlpha = 0.7;
          const map = {
            חתונה: 'THE WEDDING',
            חינה: 'THE HENNA',
            'בר מצווה': 'BAR MITZVAH',
            'בת מצווה': 'BAT MITZVAH',
            ברית: 'BRIT',
            בריתה: 'BRITA',
            'יום הולדת': 'BIRTHDAY',
            'מסיבת רווקים': 'BACHELOR PARTY',
            'מסיבת רווקות': 'BACHELORETTE PARTY',
          };
          ctx.fillText(map[form.eventType] || form.eventType || '', W / 2, y);
          ctx.globalAlpha = 1;
          y += 50;
        }

        if (step >= 3) {
          ctx.fillStyle = textColor;
          ctx.font = 'bold 48px Georgia, serif';
          const names = form.owners || 'שמות בעלי השמחה';
          const parts = names.split(/\s+&\s+|\s+ו\s+/);
          if (parts.length === 2) {
            ctx.fillText(parts[0], W / 2, y);
            y += 58;
            ctx.fillText(parts[1], W / 2, y);
          } else {
            ctx.fillText(names, W / 2, y);
          }
          y += 40;
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(W / 2 - 40, y);
          ctx.lineTo(W / 2 + 40, y);
          ctx.stroke();
          y += 45;
        }

        if (step >= 4) {
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.85;
          ctx.font = '22px Arial';
          ctx.fillText(form.inviteLine || 'הנכם מוזמנים לחגוג עמנו', W / 2, y);
          ctx.globalAlpha = 1;
          y += 55;
        }

        if (step >= 5) {
          ctx.fillStyle = textColor;
          ctx.font = '36px Arial';
          ctx.fillText(formatDate(form.date) || '00.00.0000', W / 2, y);
          y += 40;
          if (form.hebrewDate) {
            ctx.font = '20px Arial';
            ctx.globalAlpha = 0.75;
            ctx.fillText(form.hebrewDate, W / 2, y);
            ctx.globalAlpha = 1;
            y += 35;
          }
        }

        if (step >= 6) {
          ctx.fillStyle = textColor;
          ctx.font = '22px Arial';
          const place = [form.hallName, form.city].filter(Boolean).join(' | ');
          if (place) ctx.fillText(place, W / 2, y);
          y += 50;
        }

        if (step >= 7) {
          if (isWedding) {
            ctx.font = '18px Arial';
            ctx.fillStyle = mutedColor;
            ctx.fillText('קבלת פנים', W / 2 - 90, y);
            ctx.fillText('חופה', W / 2 + 90, y);
            y += 28;
            ctx.fillStyle = textColor;
            ctx.font = '24px Arial';
            ctx.fillText(form.receptionTime || '19:30', W / 2 - 90, y);
            ctx.fillText(form.chuppahTime || '20:30', W / 2 + 90, y);
          } else {
            ctx.font = '18px Arial';
            ctx.fillStyle = mutedColor;
            ctx.fillText('שעת התחלה', W / 2, y);
            y += 28;
            ctx.fillStyle = textColor;
            ctx.font = '28px Arial';
            ctx.fillText(form.receptionTime || '19:30', W / 2, y);
          }
          y += 50;
        }

        if (step >= 8) {
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.85;
          ctx.font = '22px Arial';
          ctx.fillText(form.welcomeLine || 'נשמח לראותכם', W / 2, y);
          ctx.globalAlpha = 1;
          y += 40;
        }

        // הורים — רק בחתונה
        if (step >= 9 && isWedding && (form.groomParents || form.brideParents)) {
          ctx.fillStyle = mutedColor;
          ctx.font = '16px Arial';
          ctx.fillText('הורי החתן', W / 2 - 120, y);
          ctx.fillText('הורי הכלה', W / 2 + 120, y);
          y += 26;
          ctx.fillStyle = textColor;
          ctx.font = '18px Arial';
          ctx.fillText(form.groomParents || '—', W / 2 - 120, y);
          ctx.fillText(form.brideParents || '—', W / 2 + 120, y);
          y += 40;
        }

        if (step >= 9 && loadedBottom.length) {
          const size = 90;
          const totalW = loadedBottom.length * (size + 20);
          let x = (W - totalW) / 2 + 10;
          loadedBottom.forEach((img) => {
            ctx.drawImage(img, x, Math.min(y, H - size - 40), size, size);
            x += size + 20;
          });
        }
      };

      // וידאו + אודיו ביחד
      const canvasStream = canvas.captureStream(30);
      let mixedStream = canvasStream;

      if (audioEl) {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          const actx = new AudioCtx();
          const source = actx.createMediaElementSource(audioEl);
          const dest = actx.createMediaStreamDestination();
          source.connect(dest);
          source.connect(actx.destination);
          mixedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        } catch (e) {
          console.warn('audio mix failed', e);
        }
      }

      const recorder = new MediaRecorder(mixedStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
        videoBitsPerSecond: 2500000,
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const done = new Promise((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invite-${form.owners || eventId}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          resolve();
        };
      });

      recorder.start();
      for (let step = 0; step <= 10; step++) {
        drawFrame(step);
        await new Promise((r) => setTimeout(r, 700));
      }
      await new Promise((r) => setTimeout(r, 1200));
      recorder.stop();
      await done;

      if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }

      alert('✅ הסרטון ירד למכשיר');
    } catch (err) {
      console.error(err);
      alert('שגיאה ביצירת הסרטון: ' + (err?.message || err));
    } finally {
      if (audioEl) {
        try {
          audioEl.pause();
        } catch {}
      }
      setMakingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100" dir="rtl">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold">בניית הזמנה</h1>
            <p className="text-slate-500 text-sm mt-1">בחרו דוגמה + אובייקטים · הפרטים שלכם כבר בפנים</p>
          </div>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-sm">
            ← חזרה למוזמנים
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border shadow-sm p-5">
              <div className="font-bold mb-1">דוגמאות מוכנות</div>
              <p className="text-xs text-slate-500 mb-4">לחיצה תמלא אוטומטית תבנית + אובייקטים</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`text-right rounded-xl border px-3 py-2.5 transition hover:border-amber-400 hover:bg-amber-50 ${
                      form.templateId === p.templateId &&
                      JSON.stringify(form.selectedObjects) === JSON.stringify(p.selectedObjects)
                        ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm p-5">
              <div className="font-bold mb-3">צבע רקע</div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customBg && customBg.startsWith('#') ? customBg : '#faf7f2'}
                  onChange={(e) => setCustomBg(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border"
                />
                <div className="text-sm text-slate-600">
                  {customBg ? 'צבע מותאם אישית' : 'צבע ברירת מחדל של התבנית'}
                </div>
                {customBg && (
                  <button type="button" onClick={() => setCustomBg('')} className="text-xs text-red-500 underline mr-auto">
                    איפוס
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm p-5">
              <div className="font-bold mb-3">1. בחרו דוגמה</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {TEMPLATES.map((t) => {
                  const active = form.templateId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        set('templateId', t.id);
                        setCustomBg('');
                      }}
                      className={`rounded-2xl border-2 overflow-hidden text-right transition ${
                        active ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <InviteCard form={form} template={t} formatDate={formatDate} compact customBg="" />
                      <div className="bg-white px-3 py-2 text-xs font-semibold text-slate-700 border-t">
                        {t.name}
                        {active ? ' · נבחר ✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm p-5">
              <div className="font-bold mb-3">2. אובייקטים להוספה</div>
              <div className="space-y-2">
                {OBJECTS.map((obj) => {
                  const selected = (form.selectedObjects || []).find((o) => o.id === obj.id);
                  const checked = !!selected;
                  return (
                    <div
                      key={obj.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                        checked ? 'bg-amber-50 border-amber-400' : 'border-slate-200'
                      }`}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleObject(obj.id)} className="w-4 h-4" />
                      <img src={obj.src} alt={obj.label} className="object-contain rounded" style={{ width: 40, height: 40 }} />
                      <span className="text-sm flex-1">{obj.label}</span>
                      {checked && (
                        <select
                          value={selected.position}
                          onChange={(e) => setObjectPosition(obj.id, e.target.value)}
                          className="border rounded-lg px-2 py-1 text-sm bg-white"
                        >
                          <option value="top">למעלה</option>
                          <option value="bottom">למטה</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm p-5 space-y-2">
              <div className="font-bold mb-2">3. פרטים</div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">סוג אירוע</label>
                <select
                  className="w-full border rounded-xl px-3 py-2.5 bg-white"
                  value={form.eventType}
                  onChange={(e) => set('eventType', e.target.value)}
                >
                  <option value="חתונה">חתונה</option>
                  <option value="חינה">חינה</option>
                  <option value="מסיבת רווקים">מסיבת רווקים</option>
                  <option value="מסיבת רווקות">מסיבת רווקות</option>
                  <option value="בר מצווה">בר מצווה</option>
                  <option value="בת מצווה">בת מצווה</option>
                  <option value="ברית">ברית</option>
                  <option value="בריתה">בריתה</option>
                  <option value="יום הולדת">יום הולדת</option>
                  <option value="אחר">אחר</option>
                </select>
              </div>
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="שמות" value={form.owners} onChange={(e) => set('owners', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="ראשי תיבות" value={form.monogram} onChange={(e) => set('monogram', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="ציטוט / פסוק" value={form.quote} onChange={(e) => set('quote', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="משפט הזמנה" value={form.inviteLine} onChange={(e) => set('inviteLine', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full border rounded-xl px-3 py-2.5" placeholder="תאריך לועזי" value={form.date} onChange={(e) => set('date', e.target.value)} />
                <input className="w-full border rounded-xl px-3 py-2.5" placeholder="תאריך עברי" value={form.hebrewDate} onChange={(e) => set('hebrewDate', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="w-full border rounded-xl px-3 py-2.5"
                  placeholder={form.eventType === 'חתונה' ? 'קבלת פנים' : 'שעת התחלה'}
                  value={form.receptionTime}
                  onChange={(e) => set('receptionTime', e.target.value)}
                />
                {form.eventType === 'חתונה' && (
                  <input
                    className="w-full border rounded-xl px-3 py-2.5"
                    placeholder="חופה"
                    value={form.chuppahTime}
                    onChange={(e) => set('chuppahTime', e.target.value)}
                  />
                )}
              </div>
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="אולם" value={form.hallName} onChange={(e) => set('hallName', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="עיר" value={form.city} onChange={(e) => set('city', e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2.5" placeholder="משפט סיום (למשל: נשמח לראותכם · משפחת כהן)" value={form.welcomeLine} onChange={(e) => set('welcomeLine', e.target.value)} />

              {form.eventType === 'חתונה' && (
                <>
                  <input className="w-full border rounded-xl px-3 py-2.5" placeholder="הורי החתן" value={form.groomParents} onChange={(e) => set('groomParents', e.target.value)} />
                  <input className="w-full border rounded-xl px-3 py-2.5" placeholder="הורי הכלה" value={form.brideParents} onChange={(e) => set('brideParents', e.target.value)} />
                </>
              )}

              <div className="flex flex-wrap gap-2 pt-3">
                <button type="button" onClick={save} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold">
                  {saved ? '✅ נשמר' : 'שמירה'}
                </button>
                <button type="button" onClick={copyLink} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold">
                  📋 העתק לינק
                </button>
                <button
                  type="button"
                  onClick={makeVideo}
                  disabled={makingVideo}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white px-5 py-2.5 rounded-xl font-bold"
                >
                  {makingVideo ? '⏳ יוצר סרטון...' : '🎬 צור סרטון'}
                </button>
                <Link href={`/invite/${eventId}`} target="_blank" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold">
                  תצוגה מלאה ↗
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm p-5 lg:sticky lg:top-4 h-fit">
            <div className="font-bold mb-4">תצוגה מקדימה · {template.name}</div>
            <InviteCard form={form} template={template} formatDate={formatDate} customBg={customBg} />
          </div>
        </div>
      </div>
    </div>
  );
}