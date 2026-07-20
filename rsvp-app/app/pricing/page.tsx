// @ts-nocheck
'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useCallback } from 'react';

const RSVP_OPTIONS = [
  { id: 'sms_calls', label: 'הודעות SMS + שיחות טלפוניות' },
  { id: 'calls_only', label: 'שיחות טלפוניות בלבד' },
  { id: 'sms_only', label: 'הודעות SMS בלבד' },
  { id: 'barcodes', label: 'ייצור ושליחת ברקודים' },
];

export default function PricingPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    eventType: '',
    rsvp: 'לא',
    rsvpType: '',
    rsvpPrice: '',
    seating: 'לא',
    seatingPrice: '',
    gifts: 'לא',
    giftsPrice: '',
    whatsappMsg: 'לא',
    whatsappPrice: '',
    management: 'לא',
    managementPrice: '',
    hostesses: 'לא',
    hostessesCount: '1',
    hostessesPrice: '',
    notes: ''
  });

  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => {
      const updated: any = { ...prev, [key]: value };
      if (value === 'לא' && !['hostessesCount', 'notes', 'name', 'phone', 'email', 'eventType', 'rsvpType'].includes(key)) {
        updated[`${key}Price`] = '';
      }
      if (key === 'rsvp' && value === 'לא') {
        updated.rsvpType = '';
        updated.rsvpPrice = '';
      }
      return updated;
    });
  };

  const calculatePrices = useCallback(() => {
    const prices = [
      parseFloat(formData.rsvpPrice) || 0,
      parseFloat(formData.seatingPrice) || 0,
      parseFloat(formData.giftsPrice) || 0,
      parseFloat(formData.whatsappPrice) || 0,
      parseFloat(formData.managementPrice) || 0,
      parseFloat(formData.hostessesPrice) || 0,
    ];
    const total = prices.reduce((a, b) => a + b, 0);
    const beforeVAT = total / 1.18;
    const vat = total - beforeVAT;
    return { beforeVAT, vat, total };
  }, [formData]);

  const { beforeVAT, vat, total } = calculatePrices();

  const getRsvpServiceName = () => {
    const opt = RSVP_OPTIONS.find(o => o.id === formData.rsvpType);
    if (opt) return `אישורי הגעה – ${opt.label}`;
    return 'אישורי הגעה';
  };

  const selectedServices = [
    formData.rsvp === 'כן' && { name: getRsvpServiceName(), price: formData.rsvpPrice },
    formData.seating === 'כן' && { name: 'סידורי הושבה', price: formData.seatingPrice },
    formData.gifts === 'כן' && { name: 'קבלת מתנות באשראי', price: formData.giftsPrice },
    formData.whatsappMsg === 'כן' && { name: 'הודעת ווטסאפ', price: formData.whatsappPrice },
    formData.management === 'כן' && { name: 'ניהול אירוע', price: formData.managementPrice },
    formData.hostesses === 'כן' && { name: `דיילות (${formData.hostessesCount})`, price: formData.hostessesPrice },
  ].filter(Boolean) as { name: string; price: string }[];

  const subjectLine =
    selectedServices.length > 0
      ? `הנדון: הצעת מחיר עבור: ${selectedServices.map(s => s.name).join(', ')}`
      : 'הנדון: הצעת מחיר';

  const handlePDF = async () => {
    if (isGenerating) return;
    if (formData.rsvp === 'כן' && !formData.rsvpType) {
      alert('נא לבחור סוג שירות לאישורי הגעה');
      return;
    }
    setIsGenerating(true);

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const element = document.getElementById('pdf-content');
      if (!element) throw new Error('לא נמצא אלמנט pdf-content');

      const opt = {
        margin: 10,
        filename: `הצעת_מחיר_${(formData.name || 'לקוח').replace(/[^\u0590-\u05FFa-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();

      const quote = {
        id: Date.now(),
        date: new Date().toLocaleDateString('he-IL'),
        name: formData.name || 'ללא שם',
        phone: formData.phone || '',
        eventType: formData.eventType || '',
        status: 'נשלח',
        subject: subjectLine,
        services: selectedServices.map(s => `${s.name}${s.price ? ` – ₪${s.price}` : ''}`),
        notes: formData.notes || '',
        beforeVAT: beforeVAT.toFixed(2),
        vat: vat.toFixed(2),
        total: total.toFixed(2),
      };
      const existing = JSON.parse(localStorage.getItem('eventpay-quotes') || '[]');
      localStorage.setItem('eventpay-quotes', JSON.stringify([quote, ...existing]));

      alert('✅ PDF נוצר בהצלחה!');
    } catch (err: any) {
      console.error(err);
      alert('שגיאה: ' + (err.message || err));
    } finally {
      setIsGenerating(false);
    }
  };

  const sendToWhatsapp = () => {
    if (!whatsappPhone) return alert('נא להזין מספר טלפון');
    const message = `הצעת מחיר - EventPay\n${subjectLine}\nשם: ${formData.name}\nסה"כ: ₪${total.toFixed(2)}`;
    const clean = whatsappPhone.replace(/\D/g, '').slice(-9);
    window.open(`https://wa.me/972${clean}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8f4eb, white, #f5eede)', padding: '40px 16px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '32px' }}>
          <div style={{ background: '#fffbeb', borderBottom: '3px solid #d97706', textAlign: 'center', padding: '20px 24px' }}>
            <img
              src="/eventpay-logo.jpg"
              alt="EventPay"
              style={{ height: '70px', width: 'auto', maxWidth: '100%', marginBottom: '8px', objectFit: 'contain' }}
            />
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#b45309' }}>שלח הצעת מחיר</h1>
          </div>

          <div style={{ padding: '32px' }}>
            {/* פרטי לקוח */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>שם מלא *</label>
                <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '12px', padding: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>טלפון *</label>
                <input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '12px', padding: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>דוא&quot;ל</label>
                <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '12px', padding: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>סוג האירוע</label>
                <select value={formData.eventType} onChange={e => handleChange('eventType', e.target.value)}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '12px', padding: '12px', background: 'white' }}>
                  <option value="">בחר סוג</option>
                  <option value="חתונה">חתונה</option>
                  <option value="בר מצווה">בר מצווה</option>
                  <option value="בת מצווה">בת מצווה</option>
                  <option value="בריתה">בריתה</option>
                  <option value="ברית מילה">ברית מילה</option>
                  <option value="חינה">חינה</option>
                  <option value="כנס">כנס / אירוע חברה</option>
                  <option value="אחר">אחר</option>
                </select>
              </div>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#b45309', marginBottom: '12px' }}>שירותים</h2>

            {/* אישורי הגעה + 4 אופציות */}
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontWeight: 500 }}>אישורי הגעה</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="radio" name="rsvp" checked={formData.rsvp === 'כן'} onChange={() => handleChange('rsvp', 'כן')} /> כן
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="radio" name="rsvp" checked={formData.rsvp === 'לא'} onChange={() => handleChange('rsvp', 'לא')} /> לא
                  </label>
                </div>
              </div>

              {formData.rsvp === 'כן' && (
                <div style={{ marginTop: '14px', borderTop: '1px solid #e5e7eb', paddingTop: '14px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>בחר סוג שירות:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {RSVP_OPTIONS.map(opt => (
                      <label
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: formData.rsvpType === opt.id ? '2px solid #d97706' : '1px solid #e5e7eb',
                          background: formData.rsvpType === opt.id ? '#fffbeb' : 'white',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="rsvpType"
                          checked={formData.rsvpType === opt.id}
                          onChange={() => handleChange('rsvpType', opt.id)}
                        />
                        <span style={{ fontSize: '14px' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="מחיר ₪"
                    value={formData.rsvpPrice}
                    onChange={e => handleChange('rsvpPrice', e.target.value)}
                    style={{ width: '140px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px', marginTop: '12px' }}
                  />
                </div>
              )}
            </div>

            {/* שאר השירותים */}
            {[
              { label: 'סידורי הושבה', key: 'seating' },
              { label: 'קבלת מתנות באשראי', key: 'gifts' },
              { label: 'הודעת ווטסאפ', key: 'whatsappMsg' },
              { label: 'ניהול אירוע', key: 'management' },
            ].map(({ label, key }) => (
              <div key={key} style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontWeight: 500 }}>{label}</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="radio" name={key} checked={(formData as any)[key] === 'כן'} onChange={() => handleChange(key, 'כן')} /> כן
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="radio" name={key} checked={(formData as any)[key] === 'לא'} onChange={() => handleChange(key, 'לא')} /> לא
                  </label>
                </div>
                {(formData as any)[key] === 'כן' && (
                  <input type="number" placeholder="מחיר ₪" value={(formData as any)[`${key}Price`]}
                    onChange={e => handleChange(`${key}Price`, e.target.value)}
                    style={{ width: '120px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px' }} />
                )}
              </div>
            ))}

            {/* דיילות */}
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontWeight: 500 }}>דיילות</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="radio" name="hostesses" checked={formData.hostesses === 'כן'} onChange={() => handleChange('hostesses', 'כן')} /> כן
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="radio" name="hostesses" checked={formData.hostesses === 'לא'} onChange={() => handleChange('hostesses', 'לא')} /> לא
                  </label>
                </div>
              </div>
              {formData.hostesses === 'כן' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#6b7280' }}>מספר דיילות</label>
                    <select value={formData.hostessesCount} onChange={e => handleChange('hostessesCount', e.target.value)}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px', background: 'white' }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: '#6b7280' }}>מחיר כולל ₪</label>
                    <input type="number" value={formData.hostessesPrice} onChange={e => handleChange('hostessesPrice', e.target.value)}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px' }} />
                  </div>
                </div>
              )}
            </div>

            {/* תצוגה מקדימה לכותרת */}
            {selectedServices.length > 0 && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px', color: '#1e40af' }}>
                <strong>כותרת ב-PDF:</strong>
                <div style={{ marginTop: '4px' }}>{subjectLine}</div>
              </div>
            )}

            {/* סיכום */}
            {beforeVAT > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                  <span>לפני מע&quot;מ:</span>
                  <span>₪{beforeVAT.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginTop: '4px' }}>
                  <span>מע&quot;מ 18%:</span>
                  <span>₪{vat.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '20px', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #fcd34d' }}>
                  <span>סה&quot;כ כולל מע&quot;מ:</span>
                  <span>₪{total.toFixed(2)}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#92400e', marginTop: '8px', marginBottom: 0 }}>
                  * המחירים שהזנת כבר כוללים מע&quot;מ
                </p>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>הערות</label>
              <textarea value={formData.notes} onChange={e => handleChange('notes', e.target.value)}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '12px', padding: '12px', height: '90px' }} />
            </div>

            <button type="button" onClick={handlePDF} disabled={isGenerating}
              style={{ width: '100%', background: isGenerating ? '#9ca3af' : '#059669', color: 'white', fontWeight: 'bold', fontSize: '18px', padding: '16px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
              {isGenerating ? 'יוצר PDF...' : '📄 ייצא PDF'}
            </button>
          </div>
        </div>

        {/* WhatsApp */}
        <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #a7f3d0', padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#047857', textAlign: 'center' }}>שלח בווטסאפ</h3>
          <input type="tel" placeholder="מספר טלפון (050...)" value={whatsappPhone}
            onChange={e => setWhatsappPhone(e.target.value)}
            style={{ width: '100%', border: '1px solid #6ee7b7', borderRadius: '12px', padding: '12px', marginBottom: '12px' }} dir="ltr" />
          <button type="button" onClick={sendToWhatsapp}
            style={{ width: '100%', background: '#059669', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
            💬 שלח בווטסאפ
          </button>
        </div>

        {/* PDF Content */}
        <div id="pdf-content" dir="rtl" style={{
          background: '#ffffff',
          padding: '32px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#1f2937',
          width: '210mm',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #d97706', paddingBottom: '16px' }}>
            <img src="/eventpay-logo.jpg" alt="EventPay" style={{ height: '60px', objectFit: 'contain' }} />
            <h1 style={{ fontSize: '22px', color: '#b45309', margin: '8px 0 0 0' }}>הצעת מחיר</h1>
          </div>

          <p style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '16px', lineHeight: 1.5 }}>
            {subjectLine}
          </p>

          <div style={{ marginBottom: '16px', fontSize: '14px', lineHeight: 1.7 }}>
            <div><strong>לכבוד:</strong> {formData.name || '—'}</div>
            <div><strong>טלפון:</strong> {formData.phone || '—'}</div>
            {formData.email && <div><strong>דוא&quot;ל:</strong> {formData.email}</div>}
            {formData.eventType && <div><strong>סוג אירוע:</strong> {formData.eventType}</div>}
            <div><strong>תאריך:</strong> {new Date().toLocaleDateString('he-IL')}</div>
          </div>

          {selectedServices.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#fffbeb' }}>
                  <th style={{ textAlign: 'right', padding: '10px', border: '1px solid #fcd34d' }}>שירות</th>
                  <th style={{ textAlign: 'left', padding: '10px', border: '1px solid #fcd34d' }}>מחיר</th>
                </tr>
              </thead>
              <tbody>
                {selectedServices.map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{s.name}</td>
                    <td style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'left' }} dir="ltr">
                      ₪{parseFloat(s.price || '0').toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>לפני מע&quot;מ:</span>
              <span>₪{beforeVAT.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span>מע&quot;מ 18%:</span>
              <span>₪{vat.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #fcd34d' }}>
              <span>סה&quot;כ כולל מע&quot;מ:</span>
              <span>₪{total.toFixed(2)}</span>
            </div>
          </div>

          {formData.notes && (
            <div style={{ marginBottom: '16px', fontSize: '13px' }}>
              <strong>הערות:</strong>
              <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.notes}</div>
            </div>
          )}
          {/* תנאים נוספים */}
          <div style={{
            fontSize: '12px',
            lineHeight: 1.75,
            color: '#374151',
            marginTop: '18px',
            marginBottom: '16px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '14px 16px',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#b45309' }}>בנוסף:</div>
            <p style={{ margin: '0 0 8px 0' }}>
              ההודעות לאישורי ההגעה נשלחות בווטסאפ לפי תבניות קבועות שקיימות אצלנו
              (שינוי או יצירת תבנית מיוחדת עבורכם בתוספת מחיר של 250 ש&quot;ח).
              הודעות תזכורת ותודה נשלחות ב-SMS.
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              ב-EventPay יש מחיר מינימום לאירוע עד 200 רשומות: <strong>600 ש&quot;ח</strong> (לאירועים פרטיים בלבד).
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              רשימת המוזמנים תישלח אלינו לפי פורמט האקסל שלנו שיישלח אליכם.
              אין אפשרות לשלוח רשימות בכתב יד, בווטסאפ, או בכל קובץ שאינו אקסל.
            </p>
            <p style={{ margin: 0 }}>
              על בעלי השמחה לבדוק באתר שהרשימה שהועלתה תקינה ולשביעות רצונם,
              ושהרשימה עלתה לאתר בצורה תקינה.
            </p>
          </div>
          <div style={{ fontSize: '12px', lineHeight: 1.7, color: '#374151', marginTop: '20px' }}>
            <p>התשלום יבוצע עד 7 ימים מיום קבלת ההצעה (או בסיומו). במידה ולא התבצע התשלום חברתנו שומרת את הזכות לא להגיע כלל לאירוע או לעזוב את האולם באופן מיידי.</p>
            <p>אנא דאגו להסדר התשלום מול החברה בהקדם על מנת שנוכל לשריין עבורכם את התאריך המבוקש.</p>
            <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '6px', margin: '16px 0' }}>
              <strong>פרטי חשבון:</strong><br />
              בנק מרכנתיל (17)<br />
              סניף השלום 672<br />
              חשבון מס&apos; 92555308<br />
              על שם: אברגל שמעון
            </div>
            <p>חברתנו מתחייבת לשמור על סודיות המידע ולא לעשות בו שימוש אחר מלבד לצורך אישורי הגעה ו/או סידורי הושבה.</p>
            <p><strong>ההצעה תקפה ל-7 ימים בלבד.</strong><br />יש להשיב למייל זה ולאשר את התנאים.</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>בברכה,</p>
            <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#b45309', margin: '0 0 8px 0' }}>EventPay</p>
            <p style={{ fontSize: '12px', margin: 0 }}>www.EventPay.co.il</p>
            <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Support@eventPay.co.il | 050-5270152</p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '24px' }}>
          EventPay © {new Date().getFullYear()} | כל הזכויות שמורות
        </p>
      </div>
    </div>
  );
}