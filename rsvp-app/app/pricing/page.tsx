'use client';

import { useState, useCallback } from 'react';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas-pro';

export default function PricingPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    eventType: '',
    rsvp: 'לא',
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
      if (value === 'לא' && !['hostessesCount', 'notes', 'name', 'phone', 'email', 'eventType'].includes(key)) {
        updated[`${key}Price`] = '';
      }
      return updated;
    });
  };

  const calculatePrices = useCallback(() => {
    // המחירים שהמשתמש מזין **כבר כוללים** מע"מ 18%
    const prices = [
      parseFloat(formData.rsvpPrice) || 0,
      parseFloat(formData.seatingPrice) || 0,
      parseFloat(formData.giftsPrice) || 0,
      parseFloat(formData.whatsappPrice) || 0,
      parseFloat(formData.managementPrice) || 0,
      parseFloat(formData.hostessesPrice) || 0,
    ];
    const total = prices.reduce((a, b) => a + b, 0);          // סה"כ כולל מע"מ
    const beforeVAT = total / 1.18;                           // לפני מע"מ
    const vat = total - beforeVAT;                            // סכום המע"מ
    return { beforeVAT, vat, total };
  }, [formData]);

  const { beforeVAT, vat, total } = calculatePrices();

  const handlePDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // מכריחים את html2canvas-pro
      (window as any).html2canvas = html2canvas;

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

      // localStorage
      const quote = {
        id: Date.now(),
        date: new Date().toLocaleDateString('he-IL'),
        name: formData.name,
        total: total.toFixed(2),
        status: 'נשלח',
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
    const message = `הצעת מחיר - EventPay\nשם: ${formData.name}\nסה"כ: ₪${total.toFixed(2)}`;
    const clean = whatsappPhone.replace(/\D/g, '').slice(-9);
    window.open(`https://wa.me/972${clean}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const selectedServices = [
    formData.rsvp === 'כן' && { name: 'אישורי הגעה', price: formData.rsvpPrice },
    formData.seating === 'כן' && { name: 'סידורי הושבה', price: formData.seatingPrice },
    formData.gifts === 'כן' && { name: 'קבלת מתנות באשראי', price: formData.giftsPrice },
    formData.whatsappMsg === 'כן' && { name: 'הודעת ווטסאפ', price: formData.whatsappPrice },
    formData.management === 'כן' && { name: 'ניהול אירוע', price: formData.managementPrice },
    formData.hostesses === 'כן' && { name: `דיילות (${formData.hostessesCount})`, price: formData.hostessesPrice },
  ].filter(Boolean) as { name: string; price: string }[];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8f4eb, white, #f5eede)', padding: '40px 16px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* ===== טופס על המסך ===== */}
        <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '32px' }}>
          <div style={{ background: '#fffbeb', borderBottom: '3px solid #d97706', textAlign: 'center', padding: '20px 24px' }}>
            <img 
              src="/eventpay-logo.jpg" 
              alt="EventPay" 
              style={{ 
                height: '70px', 
                width: 'auto',
                maxWidth: '100%',
                marginBottom: '8px',
                objectFit: 'contain'
              }} 
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
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>דוא"ל</label>
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

            {/* שירותים */}
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#b45309', marginBottom: '12px' }}>שירותים</h2>
            {[
              { label: 'אישורי הגעה', key: 'rsvp' },
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

            {/* סיכום */}
            {beforeVAT > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                  <span>לפני מע"מ:</span>
                  <span>₪{beforeVAT.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginTop: '4px' }}>
                  <span>מע"מ 18%:</span>
                  <span>₪{vat.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '20px', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #fcd34d' }}>
                  <span>סה"כ כולל מע"מ:</span>
                  <span>₪{total.toFixed(2)}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#92400e', marginTop: '8px', marginBottom: 0 }}>
                  * המחירים שהזנת כבר כוללים מע"מ
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

        {/* ===== PDF CONTENT - רק hex colors, בלי Tailwind classes ===== */}
        <div id="pdf-content" dir="rtl" style={{
          background: '#ffffff',
          padding: '32px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#1f2937',
          width: '210mm',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          {/* כותרת + לוגו */}
          <div style={{ textAlign: 'center', borderBottom: '3px solid #d97706', paddingBottom: '16px', marginBottom: '24px' }}>
            <img 
              src="/eventpay-logo.jpg" 
              alt="EventPay Logo" 
              style={{ 
                height: '80px', 
                width: '100%',
                maxWidth: '420px',
                marginBottom: '10px',
                objectFit: 'contain'
              }} 
            />
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#b45309', margin: '0 0 6px 0' }}>הצעת מחיר</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* פרטי לקוח */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#b45309', borderBottom: '1px solid #fcd34d', paddingBottom: '4px', marginBottom: '12px' }}>
              פרטי לקוח
            </h2>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 600, width: '100px' }}>שם:</td>
                  <td style={{ padding: '6px 0' }}>{formData.name || '________________'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 600 }}>טלפון:</td>
                  <td style={{ padding: '6px 0' }}>{formData.phone || '________________'}</td>
                </tr>
                {formData.email && (
                  <tr>
                    <td style={{ padding: '6px 0', fontWeight: 600 }}>דוא"ל:</td>
                    <td style={{ padding: '6px 0' }}>{formData.email}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 600 }}>סוג אירוע:</td>
                  <td style={{ padding: '6px 0' }}>{formData.eventType || '________________'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* שירותים */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#b45309', borderBottom: '1px solid #fcd34d', paddingBottom: '4px', marginBottom: '12px' }}>
              שירותים
            </h2>
            {selectedServices.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>לא נבחרו שירותים</p>
            ) : (
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600 }}>שירות</th>
                    <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 600 }}>מחיר</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedServices.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 0' }}>{s.name}</td>
                      <td style={{ padding: '8px 0', textAlign: 'left' }}>₪{s.price || '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* סיכום */}
          {beforeVAT > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <table style={{ width: '100%', fontSize: '14px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 0' }}>לפני מע"מ:</td>
                    <td style={{ padding: '4px 0', textAlign: 'left', fontWeight: 500 }}>₪{beforeVAT.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0' }}>מע"מ 18%:</td>
                    <td style={{ padding: '4px 0', textAlign: 'left', fontWeight: 500 }}>₪{vat.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #f59e0b' }}>
                    <td style={{ padding: '10px 0 0 0', fontWeight: 'bold', fontSize: '16px' }}>סה"כ כולל מע"מ:</td>
                    <td style={{ padding: '10px 0 0 0', textAlign: 'left', fontWeight: 'bold', fontSize: '16px', color: '#b45309' }}>₪{total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* הערות */}
          {formData.notes && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#b45309', borderBottom: '1px solid #fcd34d', paddingBottom: '4px', marginBottom: '8px' }}>
                הערות
              </h2>
              <p style={{ fontSize: '13px', whiteSpace: 'pre-line', margin: 0 }}>{formData.notes}</p>
            </div>
          )}

          {/* תנאי השימוש */}
          <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #d1d5db' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#92400e', marginBottom: '12px' }}>
              תנאי השימוש והערות חשובות
            </h2>
            <div style={{ fontSize: '11px', lineHeight: 1.6, color: '#374151' }}>
              <p style={{ marginBottom: '10px' }}>
                <strong>שים לב:</strong> * המחיר מתייחס להודעות + שיחות טלפוניות עבור עד 250 רשומות טלפוניות, 
                חריגה במספר הרשומות הטלפוניות תחויב בתשלום נוסף (2.5 ₪ לרשומה).
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong>הערות:</strong><br/>
                1. הודעה ראשונה לאישור הגעה נשלחת בווטסאפ.<br/>
                2. הודעה שניה תזכורת כולל קישור לניווט אוטומטי הישר לכתובת האולם באמצעות Waze + הודעת "תודה" למחרת האירוע.<br/>
                3. שיחות טלפון לכל מי שלא אישר הגעה בהודעה.
              </p>
              <p style={{ marginBottom: '10px' }}>
                ההודעות לאישורי ההגעה נשלחות בווטסאפ לפי תבניות קבועות שקיימות אצלנו. 
                שאר ההודעות (תזכורת והודעת תודה) נשלחות ב-SMS!
              </p>
              <p style={{ marginBottom: '10px' }}>
                ב-EventPay ישנו מחיר מינימום עבור שירות אישורי ההגעה והוא 500 ₪ לעד 200 רשומות (לאירועים פרטיים בלבד).
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong>שים לב:</strong> ההודעות לאורחים נשלחות עם "שם האורח" בדיוק כפי ששמו מופיע ברשימת המוזמנים. 
                על השמות להיות שלמים (לדוגמא: "יוסי ועליזה כהן") ולא "יוסי השכן" או "דנה הקוסמטיקאית". 
                חברתנו אינה אחראית במידה ונשלחה הודעה בתוספת כינוי כלשהוא.
              </p>
              <p style={{ marginBottom: '10px' }}>
                הרשימה תישלח אלינו בקובץ אקסל לפי הפורמט שלנו 14 יום לפני האירוע. 
                אין אפשרות לשלוח לנו רשימות בכתב יד או בקובץ אחר שאינו קובץ אקסל.
              </p>
              <p style={{ marginBottom: '10px' }}>
                על בעלי השמחה לבדוק באתר שהרשימה שהועלתה הינה תקינה ולשביעות רצונם. 
                הוספת רשומות תיעשה ישירות באתר על ידי בעלי השמחה (אין אפשרות לשלוח לנו רשומות בווטסאפ).
              </p>
              <p style={{ marginBottom: '10px' }}>
                בעלי השמחה יספקו לחברתנו סקיצה של ההושבה ממנהל האירועים של האולם. 
                הושבת המוזמנים במערכת נעשית אך ורק על ידי בעלי השמחה ועליהם לסיים את ההושבה עד 24 שעות לפני האירוע. 
                במקרה וההושבה לא נעשתה במלואה במערכת – חברתנו לא אחראית על ההשלכות.
              </p>
              <p style={{ marginBottom: '10px' }}>
                התשלום מתבצע עד יום האירוע או עם כניסת הצוות לאולם (ולא לאחר האירוע או בסיומו). 
                במידה ולא התבצע התשלום – חברתנו שומרת את הזכות לא להגיע כלל לאירוע או לעזוב את האולם באופן מיידי.
              </p>
              <p style={{ marginBottom: '10px' }}>
                אנא דאגו להסדר התשלום מול החברה בהקדם על מנת שנוכל לשריין עבורכם את התאריך המבוקש.
              </p>

              <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '6px', margin: '16px 0' }}>
                <strong>פרטי חשבון:</strong><br/>
                בנק מרכנתיל (17)<br/>
                סניף השלום 672<br/>
                חשבון מס' 92555308<br/>
                על שם: אברגל שמעון
              </div>

              <p style={{ marginBottom: '10px' }}>
                חברתנו מתחייבת לשמור על סודיות המידע ולא לעשות בו שימוש אחר מלבד לצורך אישורי הגעה ו/או סידורי הושבה.
              </p>
              <p style={{ marginBottom: '16px' }}>
                <strong>ההצעה תקפה ל-7 ימים בלבד.</strong><br/>
                יש להשיב למייל זה ולאשר את התנאים.
              </p>

              <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>בברכה,</p>
                <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#b45309', margin: '0 0 8px 0' }}>EventPay</p>
                <p style={{ fontSize: '12px', margin: '0' }}>www.EventPay.co.il</p>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Support@eventPay.co.il | 050-5270152</p>
              </div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '24px' }}>
          EventPay © {new Date().getFullYear()} | כל הזכויות שמורות
        </p>
      </div>
    </div>
  );
}
