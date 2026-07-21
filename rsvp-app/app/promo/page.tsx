// @ts-nocheck
'use client';

import { useState } from 'react';

export default function PromoPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    day: '',
    month: '',
    year: '2026',
  });

  const openWhatsApp = () => {
    window.open('https://wa.me/972505270152', '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      alert('נא למלא שם וטלפון');
      return;
    }
    const dateStr = [form.day, form.month, form.year].filter(Boolean).join('/');
    const text = encodeURIComponent(
      `שלום, אשמח לקבל הצעת מחיר\nשם: ${form.name}\nטלפון: ${form.phone}${dateStr ? `\nתאריך אירוע: ${dateStr}` : ''}`
    );
    window.open(`https://wa.me/972505270152?text=${text}`, '_blank');
  };

  const features = [
    { icon: '⚙️', text: 'מערכת חכמה להושבת המוזמנים שלכם!' },
    { icon: '🖨️', text: 'הורדת והדפסת פתקיות לאחר גמר ההושבה!' },
    { icon: '💬', text: 'ביום האירוע אורחיכם יקבלו הודעת SMS כתזכורת לאירוע ובה יצויין מקום הישיבה המדויק שלהם!' },
    { icon: '👤', text: 'אפשרות לדיילים/דיילות בכניסה לאולם!' },
    { icon: '❤️', text: 'והכי חשוב... שירות מכל הלב!' },
  ];

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        fontFamily: 'Arial, Helvetica, sans-serif',
        backgroundImage: 'linear-gradient(rgba(255,248,240,0.88), rgba(255,248,240,0.92)), url(/chatan-kala.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* כותרת עליונה */}
      <div style={{
        background: 'rgba(63,42,30,0.92)',
        color: 'white',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        fontSize: '15px',
      }}>
        <span>ליצירת קשר:</span>
        <a
          href="https://wa.me/972505270152"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#fbbf24', fontWeight: 'bold', textDecoration: 'none' }}
        >
          050-5270152
        </a>
      </div>

      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 20px 60px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '40px',
        alignItems: 'start',
      }}>
        {/* צד ימין – שירות */}
        <div>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800,
            color: '#1e3a5f',
            margin: '0 0 28px 0',
            lineHeight: 1.3,
          }}>
            שירות סידורי הושבה לאירועים!
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{f.icon}</span>
                <p style={{ margin: 0, fontSize: '17px', color: '#92400e', fontWeight: 600, lineHeight: 1.45 }}>
                  {f.text}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.location.href = '/pricing'}
            style={{
              marginTop: '32px',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            לחצו לפרטים נוספים!
          </button>
        </div>

        {/* צד שמאל – מבצע + טופס */}
        <div>
          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 34px)',
            fontWeight: 800,
            color: '#b45309',
            margin: '0 0 8px 0',
          }}>
            מבצע מטורף!
          </h2>
          <p style={{
            fontSize: 'clamp(22px, 3vw, 28px)',
            fontWeight: 800,
            color: '#1e3a5f',
            margin: '0 0 6px 0',
            lineHeight: 1.35,
          }}>
            אישורי הגעה
            <br />
            וסידורי הושבה
            <br />
            ממוחשבים
            <br />
            ב־1000 ש״ח
            <br />
            בלבד!*
          </p>

          <p style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1e3a5f',
            margin: '24px 0 12px',
          }}>
            חייגו עכשיו או
            <br />
            לחצו לשליחת WhatsApp:
          </p>

          <button
            onClick={openWhatsApp}
            style={{
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '40px',
              padding: '14px 36px',
              fontSize: '22px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(34,197,94,0.35)',
            }}
          >
            0505270152
          </button>

          <p style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1e3a5f',
            margin: '32px 0 16px',
          }}>
            או מלאו את פרטיכם!
          </p>

          <form onSubmit={handleSubmit} style={{ maxWidth: '320px' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#374151' }}>שם:</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #9ca3af',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '12px',
                fontSize: '15px',
              }}
            />

            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#374151' }}>טלפון:</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #9ca3af',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '12px',
                fontSize: '15px',
              }}
            />

            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#374151' }}>תאריך האירוע:</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <select
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #9ca3af' }}
              >
                <option value="">יום</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #9ca3af' }}
              >
                <option value="">חודש</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #9ca3af' }}
              >
                {['2026', '2027', '2028'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 28px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              שלחו
            </button>
          </form>

          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '20px', maxWidth: '320px', lineHeight: 1.4 }}>
            *עד 200 רשומות. במסגרת שירות סידורי ההושבה נוכחות דיילים/דיילות מטעמנו אפשרית בתוספת תשלום ואינה כלולה במחיר המוצג
          </p>
        </div>
      </div>
    </div>
  );
}