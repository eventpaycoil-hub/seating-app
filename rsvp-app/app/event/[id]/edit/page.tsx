// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : '1';

  const [formData, setFormData] = useState({
    eventType: 'חתונה',
    eventDate: '',
    owners: 'שלומי ויעל',
    hallName: 'אולם אירועים סאו',
    city: 'אשדוד',
    year: '2026',
    month: 'יולי',
    day: '29',
    time: '19:30',
    groomParents: 'משה ומזל וקנין',
    brideParents: 'אבי ואורנה כחלון',
    email: 'eventpay.co.il@gmail.com',
    price: '35000',
    deposit: '10000',
    serviceType: 'אישורי הגעה וסידורי הושבה',
    seatingArrangement: 'כן',
    qrCode: 'כן',
    guestNotes: 'כן',
    englishEvent: 'לא',
    nufarEvent: 'לא',
    showSeatingLink: 'כן',
    smsService: 'כן',
    stewardService: 'לא',
    miscellaneous: 'לא',
    miscellaneousNotes: ['', '', '', '', '', ''],
    showLandingText: 'לא',
    landingText: '',
    afterConfirmationText: '',
    whatsappTemplate1: '',
    whatsappTemplate2: '',
    notes: '',
    isActive: false,
    activatedAt: null,
    creditLink: '',
    fullDate: '',
    hasTransport: 'לא',
    hasSeparation: 'לא',
    clientPhone: '',
  });

  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) {
      setFormData((prev) => ({
        ...prev,
        ...currentEvent,
        time: currentEvent.time || '19:30',
        hasTransport: currentEvent.hasTransport || 'לא',
        hasSeparation: currentEvent.hasSeparation || 'לא',
        clientPhone: currentEvent.clientPhone || '',
      }));
    }
  }, [eventId]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

    const generateUsername = (owners: string) => {
    return (
      (owners || 'event').replace(/\s+/g, '').toLowerCase().slice(0, 12) +
      Math.floor(1000 + Math.random() * 9000)
    );
  };

      const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
  };
  const toggleActivate = () => {
    const turningOn = !formData.isActive;

    // כיבוי – בלי שליחה
    if (!turningOn) {
      const updatedData = {
        ...formData,
        isActive: false,
        activatedAt: null,
      };
      setFormData(updatedData);
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const updatedEvents = events.map((e: any) =>
        e.id.toString() === eventId ? { ...e, ...updatedData } : e
      );
      localStorage.setItem('myEvents', JSON.stringify(updatedEvents));
      alert('האירוע הושבת.');
      return;
    }

   // תמיד פרטי כניסה חדשים בהפעלה
    const username =
      (formData.owners || 'event')
        .replace(/[^a-zA-Z0-9א-ת]/g, '')
        .slice(0, 10) + Math.floor(1000 + Math.random() * 9000);
    const password = generatePassword();

    const updatedData = {
      ...formData,
      isActive: true,
      activatedAt: new Date().toISOString(),
      username,
      password,
    };
    setFormData(updatedData);

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const updatedEvents = events.map((e: any) =>
      e.id.toString() === eventId ? { ...e, ...updatedData } : e
    );
    localStorage.setItem('myEvents', JSON.stringify(updatedEvents));

    const phone =
      (formData as any).clientPhone ||
      (formData as any).phone ||
      '';

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const loginUrl = `${origin}/`;

    const welcomeMsg =
      `שלום ${formData.owners}!\n\n` +
      `האירוע שלכם פעיל עכשיו ב-EventPay.\n\n` +
      `שם משתמש: ${username}\n` +
      `סיסמה: ${password}\n\n` +
      `כניסה: ${loginUrl}\n\n` +
      `בהצלחה! EventPay`;

    if (phone && phone.replace(/\D/g, '').length >= 9) {
      const clean = phone.replace(/\D/g, '');
      const waPhone = clean.startsWith('972')
        ? clean
        : '972' + (clean.startsWith('0') ? clean.slice(1) : clean);
      const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(welcomeMsg)}`;
      window.open(whatsappUrl, '_blank');
      alert(
        `🎉 האירוע הופעל!\n\nשם משתמש: ${username}\nסיסמה: ${password}\n\nנפתח WhatsApp לשליחה ללקוח`
      );
    } else {
      alert(
        `🎉 האירוע הופעל!\n\nשם משתמש: ${username}\nסיסמה: ${password}\n\n⚠️ לא נמצא טלפון לקוח – העתק ידנית או מלא טלפון ושמור.`
      );
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const updatedEvent = {
      ...formData,
      id: parseInt(eventId),
      creditLink: formData.creditLink || '',
    };

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const index = events.findIndex((e: any) => e.id.toString() === eventId);

    if (index !== -1) {
      events[index] = updatedEvent;
    } else {
      events.push(updatedEvent);
    }

    localStorage.setItem('myEvents', JSON.stringify(events));
    alert('✅ נשמר!');
  };

  const deleteEventPermanently = () => {
    const expected = (formData.owners || '').trim();
    if (!expected) {
      alert('אין שם אירוע לאימות');
      return;
    }
    if (deleteConfirmText.trim() !== expected) {
      alert('יש להקליד בדיוק את שם בעלי השמחה כדי למחוק');
      return;
    }

    if (
      !confirm(
        `אזהרה אחרונה!\n\nלמחוק לצמיתות את האירוע של "${expected}"?\nיימחקו גם כל המוזמנים של האירוע.\n\nפעולה זו לא ניתנת לביטול.`
      )
    ) {
      return;
    }

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const updated = events.filter((ev: any) => ev.id.toString() !== eventId.toString());
    localStorage.setItem('myEvents', JSON.stringify(updated));

    localStorage.removeItem(`guests_event_${eventId}`);
    localStorage.removeItem(`groups_event_${eventId}`);
    localStorage.removeItem(`seatingTables_${eventId}`);
    localStorage.removeItem(`seatingTables`);

    alert('✅ האירוע נמחק לצמיתות');
    router.push('/events');
  };

  const eventTypes = [
    'חתונה',
    'בר מצוה',
    'בת מצוה',
    'בר ובת מצוה',
    'ברית',
    'בריתה',
    'כנס',
    '2 כפתורים',
    '3 כפתורים',
    'אחר 3',
    'אירוע עם דף נחיתה פנימי',
  ];
  const serviceTypes = [
    'אישורי הגעה בלבד',
    'אישורי הגעה וסידורי הושבה',
    'אישורי הגעה סידורי הושבה ושירות מתנה באשראי',
    'ניהול אירוע מלא',
  ];

  const publicLink =
    typeof window !== 'undefined' ? `${window.location.origin}/event/${eventId}/landing` : '';

  const copyPublicLink = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink);
      alert('✅ הלינק הועתק! שלח אותו לבעל השמחה');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5e8c7] p-8" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-10">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-[#4a2c0f]">
            עריכת פרטי אירוע - {formData.owners}
          </h1>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline">
            ← חזרה לרשימת מוזמנים
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-xl text-blue-800">לינק להפצה לאנשים שלא ברשימה</div>
                <div className="text-sm text-blue-600 mt-1">
                  לינק קבוע שבעל השמחה יכול לשלוח לאורחים נוספים
                </div>
              </div>
              <button
                type="button"
                onClick={copyPublicLink}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold"
              >
                📋 העתק לינק
              </button>
            </div>
            <div className="bg-white border rounded-2xl px-4 py-3 text-sm text-gray-700 break-all">
              {publicLink || `http://localhost:3000/event/${eventId}/landing`}
            </div>
          </div>

          <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-xl">סטטוס אירוע</div>
                <div
                  className={`text-lg mt-1 ${formData.isActive ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formData.isActive ? '✅ האירוע פעיל' : '⏳ האירוע לא פעיל'}
                </div>
              </div>
              <button
                type="button"
                onClick={toggleActivate}
                className={`px-10 py-4 rounded-2xl text-xl font-bold transition-all ${
                  formData.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {formData.isActive ? '⚠️ השבת את האירוע' : '🚀 הפעל את האירוע'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">שם בעלי השמחה:</label>
            <input
              type="text"
              name="owners"
              value={formData.owners}
              onChange={handleChange}
              className="w-full p-4 border rounded-2xl text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              טלפון הלקוח (לשליחת פרטי כניסה):
            </label>
            <input
              type="tel"
              name="clientPhone"
              value={(formData as any).clientPhone || ''}
              onChange={(e) =>
                setFormData({ ...formData, clientPhone: e.target.value } as any)
              }
              className="w-full p-4 border rounded-2xl text-lg"
              placeholder="050-5270152"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">סוג האירוע:</label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="w-full p-4 border rounded-2xl text-lg"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">שם האולם:</label>
              <input
                type="text"
                name="hallName"
                value={formData.hallName}
                onChange={handleChange}
                className="w-full p-4 border rounded-2xl text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">עיר:</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-4 border rounded-2xl text-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">תאריך האירוע:</label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                className="w-full p-4 border rounded-2xl text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">שעת האירוע:</label>
              <input
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full p-4 border rounded-2xl text-lg"
                placeholder="19:30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">הורי החתן:</label>
              <input
                type="text"
                name="groomParents"
                value={formData.groomParents}
                onChange={handleChange}
                className="w-full p-4 border rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">הורי הכלה:</label>
              <input
                type="text"
                name="brideParents"
                value={formData.brideParents}
                onChange={handleChange}
                className="w-full p-4 border rounded-2xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">קישור לאשראי (מתנה):</label>
            <input
              type="url"
              name="creditLink"
              value={formData.creditLink}
              onChange={handleChange}
              className="w-full p-4 border rounded-2xl text-lg"
              placeholder="https://pay.example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">מחיר האירוע (₪)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-4 border rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">מקדמה ששולמה (₪)</label>
              <input
                type="number"
                name="deposit"
                value={formData.deposit}
                onChange={handleChange}
                className="w-full p-4 border rounded-2xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">סוג השירות:</label>
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              className="w-full p-4 border rounded-2xl"
            >
              {serviceTypes.map((type, i) => (
                <option key={i} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'סידורי הושבה', name: 'seatingArrangement' },
              { label: 'QR Code', name: 'qrCode' },
              { label: 'הערות מוזמן', name: 'guestNotes' },
              { label: 'אירוע באנגלית', name: 'englishEvent' },
              { label: 'אירוע של נופר', name: 'nufarEvent' },
              { label: 'הצג קישור הושבה', name: 'showSeatingLink' },
              { label: 'שליחת SMS', name: 'smsService' },
              { label: 'שירות דיילות', name: 'stewardService' },
              { label: 'הסעות', name: 'hasTransport' },
              { label: 'אירוע בהפרדה', name: 'hasSeparation' },
            ].map((field) => (
              <label key={field.name} className="flex items-center gap-3 text-lg">
                <input
                  type="checkbox"
                  checked={formData[field.name as keyof typeof formData] === 'כן'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      [field.name]:
                        formData[field.name as keyof typeof formData] === 'כן' ? 'לא' : 'כן',
                    })
                  }
                />
                {field.label}
              </label>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-16 py-5 rounded-2xl text-2xl font-medium"
            >
              שמור שינויים
            </button>
          </div>
        </form>

        {/* ===== אזור מסוכן – מחיקת אירוע ===== */}
        <div className="mt-16 border-t-2 border-rose-200 pt-10">
          <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-bold text-rose-800">אזור מסוכן</h3>
                <p className="text-sm text-rose-700 mt-1">
                  מחיקת אירוע מוחקת גם את כל המוזמנים. לא ניתן לשחזר.
                </p>
              </div>
              {!showDeleteZone ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteZone(true)}
                  className="bg-white border-2 border-rose-400 text-rose-700 hover:bg-rose-100 px-6 py-3 rounded-2xl font-bold"
                >
                  מחק אירוע…
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteZone(false);
                    setDeleteConfirmText('');
                  }}
                  className="text-slate-500 underline text-sm"
                >
                  ביטול
                </button>
              )}
            </div>

            {showDeleteZone && (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-rose-800">
                  להמשך הקלד בדיוק את שם בעלי השמחה:{' '}
                  <strong className="select-all">{formData.owners}</strong>
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="הקלד את שם בעלי השמחה"
                  className="w-full p-4 border-2 border-rose-300 rounded-2xl bg-white"
                />
                <button
                  type="button"
                  onClick={deleteEventPermanently}
                  disabled={deleteConfirmText.trim() !== (formData.owners || '').trim()}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg"
                >
                  מחק אירוע לצמיתות
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}