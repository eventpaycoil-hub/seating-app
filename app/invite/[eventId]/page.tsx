// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

const TEMPLATES = [
  { id: 'classic-cream', name: 'קלאסי שמנת', bg: '#f7f3eb', text: '#1c1917', muted: '#57534e', line: '#d6d3d1', deco: 'none', frame: 'simple' },
  { id: 'double-frame', name: 'מסגרת כפולה', bg: '#faf8f4', text: '#1c1917', muted: '#57534e', line: '#a8a29e', deco: 'none', frame: 'double' },
  { id: 'rings-gold', name: 'טבעות זהב + שמפניה', bg: '#fffbeb', text: '#422006', muted: '#92400e', line: '#fcd34d', deco: 'rings-champagne', frame: 'simple' },
  { id: 'floral-soft', name: 'פרחים רכים', bg: '#fdfcf9', text: '#365314', muted: '#4d7c0f', line: '#d9f99d', deco: 'floral', frame: 'simple' },
  { id: 'romantic-peach', name: 'רומנטי אפרסק', bg: '#fff7ed', text: '#9a3412', muted: '#c2410c', line: '#fdba74', deco: 'peach-floral', frame: 'simple' },
  { id: 'dancing-couple', name: 'רקדנים אלגנטי', bg: '#fafaf9', text: '#1c1917', muted: '#57534e', line: '#d6d3d1', deco: 'dancers', frame: 'simple' },
  { id: 'dark-luxury', name: 'יוקרה כהה', bg: '#0c0a09', text: '#fafaf9', muted: '#a8a29e', line: '#44403c', deco: 'ornament', frame: 'double' },
  { id: 'olive-garden', name: 'ירוק זית עשיר', bg: '#f5f7f0', text: '#3f6212', muted: '#65a30d', line: '#bef264', deco: 'leaves', frame: 'simple' },
  { id: 'navy-elegant', name: 'כחול אלגנטי', bg: '#0f172a', text: '#f8fafc', muted: '#94a3b8', line: '#334155', deco: 'none', frame: 'double' },
  { id: 'minimal-bw', name: 'מינימלי שחור', bg: '#ffffff', text: '#0a0a0a', muted: '#525252', line: '#e5e5e5', deco: 'line', frame: 'simple' },
  { id: 'vintage', name: 'וינטג׳ זהב', bg: '#faf7f2', text: '#44403c', muted: '#78716c', line: '#d6d3d1', deco: 'ornament', frame: 'double' },
  { id: 'bar-party', name: 'בר/בת שמח', bg: '#eff6ff', text: '#1e3a8a', muted: '#3b82f6', line: '#93c5fd', deco: 'stars', frame: 'simple' },
  { id: 'botanical-sage', name: 'בוטני ירוק-זהב', bg: '#f5f0e6', text: '#3f2a1e', muted: '#6b5c4c', line: '#c4a574', deco: 'leaves', frame: 'double' },
  { id: 'soft-emboss', name: 'יוקרה רכה לבן', bg: '#faf9f7', text: '#5c5346', muted: '#8a8070', line: '#e8e4dc', deco: 'floral', frame: 'simple' },
  { id: 'line-floral', name: 'פרחים בקו שחור', bg: '#ffffff', text: '#1a1a1a', muted: '#525252', line: '#d4d4d4', deco: 'floral', frame: 'simple' },
  { id: 'deckle-white', name: 'מינימלי קצה רך', bg: '#f7f7f5', text: '#2c2c2c', muted: '#6b6b6b', line: '#d0d0d0', deco: 'line', frame: 'simple' },
  { id: 'bar-brown', name: 'בר מצווה חום', bg: '#faf6f1', text: '#5c4033', muted: '#8b6914', line: '#c4a484', deco: 'ornament', frame: 'double' },
  { id: 'bat-eucalyptus', name: 'בת מצווה אקליפטוס', bg: '#f7faf7', text: '#2d5a3d', muted: '#5a8f6d', line: '#d4af37', deco: 'leaves', frame: 'simple' },
  { id: 'formal-ivory', name: 'רשמי שנהב', bg: '#f8f5f0', text: '#3d3d3d', muted: '#6b6b6b', line: '#c9c0b0', deco: 'ornament', frame: 'double' },
  { id: 'romantic-script', name: 'רומנטי כתב חופשי', bg: '#faf8f6', text: '#3f2a1e', muted: '#7c6a58', line: '#e7d5c4', deco: 'peach-floral', frame: 'simple' },
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
  if (type === 'dancers') return <div className="text-4xl mb-4 opacity-90 tracking-widest">💃 🕺</div>;
  if (type === 'peach-floral') return <div className="text-xl mb-3 opacity-80">🌸 🏵️ 🌸</div>;
  if (type === 'floral') return <div className="text-xl mb-3 opacity-70">🌿 🌸 🌿</div>;
  if (type === 'leaves') return <div className="text-xl mb-3 opacity-70">🍃 ✨ 🍃</div>;
  if (type === 'stars') return <div className="text-xl mb-3 opacity-70">✦ ★ ✦</div>;
  if (type === 'ornament') return <div className="text-base mb-3 tracking-[0.35em] opacity-60">❖ ❖ ❖</div>;
  if (type === 'line') return <div className="w-px h-10 mx-auto mb-4 bg-current opacity-40" />;
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

function EnvelopeClosed({ monogram, owners, onOpen }) {
  const letters =
    monogram ||
    (owners
      ? owners
          .split(/\s+&\s+|\s+ו\s+/)
          .map((p) => (p.trim()[0] || '').toUpperCase())
          .join('')
          .slice(0, 3)
      : '✦');

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full max-w-[380px] mx-auto cursor-pointer border-0 bg-transparent p-0 focus:outline-none"
      aria-label="פתחו את המעטפה"
    >
      {/* גוף המעטפה */}
      <div
        className="relative mx-auto transition-transform duration-500 group-hover:scale-[1.02]"
        style={{ width: 320, height: 220 }}
      >
        {/* משולש תחתון */}
        <div
          className="absolute inset-x-0 bottom-0 rounded-b-sm shadow-xl"
          style={{
            height: 160,
            background: 'linear-gradient(160deg, #c4a574 0%, #8b6914 45%, #6b4423 100%)',
          }}
        />
        {/* דש שמאל */}
        <div
          className="absolute bottom-0 left-0"
          style={{
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '80px 0 80px 160px',
            borderColor: 'transparent transparent transparent #a67c52',
            opacity: 0.9,
          }}
        />
        {/* דש ימין */}
        <div
          className="absolute bottom-0 right-0"
          style={{
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '80px 160px 80px 0',
            borderColor: 'transparent #8b6914 transparent transparent',
            opacity: 0.95,
          }}
        />
        {/* דש עליון (סגור) */}
        <div
          className="absolute top-0 left-0 right-0 origin-top transition-transform duration-300 group-hover:-translate-y-1"
          style={{
            height: 100,
            background: 'linear-gradient(180deg, #d4b896 0%, #b8956c 100%)',
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
          }}
        />
        {/* מונוגרם */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 z-10 pointer-events-none">
          <div
            className="text-4xl font-serif tracking-[0.2em] text-[#f5f0e6] drop-shadow"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
          >
            {letters}
          </div>
          <div className="mt-3 text-xs tracking-widest text-[#f5f0e6]/90 uppercase">
            הזמנה
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <span className="inline-block bg-[#3f2a1e] text-[#f5f0e6] px-8 py-3 rounded-full text-sm font-medium shadow-lg group-hover:bg-[#5c4033] transition">
          פתחו את המעטפה
        </span>
        <p className="mt-3 text-stone-500 text-xs">לחצו לפתיחה</p>
      </div>
    </button>
  );
}

export default function PublicInvitePage() {
  const params = useParams();
  const eventId = String(params?.eventId || params?.id || '');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      const inv = JSON.parse(localStorage.getItem(`invitation_${eventId}`) || 'null');

      if (inv) {
        setForm(inv);
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
            quote: '',
            hebrewDate: '',
            photoUrl: '',
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

  const handleOpen = () => {
    setOpened(true);
    // אחרי אנימציית המעטפה — מציגים את ההזמנה
    setTimeout(() => setShowCard(true), 650);
  };

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

  const isWedding = form.eventType === 'חתונה';
  const isBarBat = form.eventType === 'בר מצווה' || form.eventType === 'בת מצווה';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8"
      style={{ background: '#f5f0e8' }}
      dir="rtl"
    >
      {/* מצב מעטפה סגורה */}
      {!showCard && (
        <div
          className={`w-full flex justify-center transition-all duration-700 ${
            opened ? 'opacity-0 scale-95 pointer-events-none absolute' : 'opacity-100 scale-100'
          }`}
        >
          <EnvelopeClosed monogram={form.monogram} owners={form.owners} onOpen={handleOpen} />
        </div>
      )}

      {/* הזמנה — אחרי פתיחה */}
      {showCard && (
        <div
          className="w-full flex justify-center animate-[inviteIn_0.7s_ease-out]"
          style={{
            animation: 'inviteIn 0.7s ease-out forwards',
          }}
        >
          <style>{`
            @keyframes inviteIn {
              from { opacity: 0; transform: translateY(24px) scale(0.96); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          <div
            className="relative w-full max-w-[440px] shadow-2xl overflow-hidden"
            style={{
              background: form.customBg || template.bg,
              color: template.text,
              border:
                template.frame === 'double'
                  ? `3px double ${template.line}`
                  : `1px solid ${template.line}`,
            }}
          >
            <div className="absolute top-4 left-4 text-[11px] opacity-50">בס״ד</div>

            {(template.deco === 'floral' || template.deco === 'peach-floral') && (
              <>
                <div className="absolute top-3 right-3 text-xl opacity-50">🌸</div>
                <div className="absolute bottom-3 left-3 text-xl opacity-50">🌿</div>
                <div className="absolute bottom-3 right-3 text-xl opacity-50">🌸</div>
              </>
            )}

            <div className="px-8 pt-14 pb-12 text-center">
              {form.quote && (
                <div className="text-sm mb-5 leading-relaxed opacity-80" style={{ color: template.muted }}>
                  "{form.quote}"
                </div>
              )}

              <Deco type={template.deco} />

              {form.monogram && (
                <div
                  className="text-5xl tracking-[0.15em] mb-4 font-serif"
                  style={{ color: template.line }}
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
                {(() => {
                  const map = {
                    חתונה: 'THE WEDDING',
                    'בר מצווה': 'BAR MITZVAH',
                    'בת מצווה': 'BAT MITZVAH',
                    כנס: 'CONFERENCE',
                    הופעה: 'SHOW',
                  };
                  return map[form.eventType] || form.eventType;
                })()}
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

              {isWedding && (form.groomParents || form.brideParents) && (
                <div className="flex justify-between gap-4 text-xs" style={{ color: template.muted }}>
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
      )}
    </div>
  );
}