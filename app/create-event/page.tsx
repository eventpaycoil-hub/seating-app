'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CreateEventPage() {
  const [formData, setFormData] = useState({
    eventType: '',
    rsvpMode: 'רגיל',
    welcomeLine: '',
    useExternalLanding: 'לא',
    externalLandingUrl: '',
    owners: '',
    hallName: '',
    city: '',
    eventDate: '',
    time: '19:30',
    groomParents: '',
    brideParents: '',
    email: '',
    phone: '',
    price: '',
    deposit: '',
    serviceType: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateUsername = (owners: string) => {
    let base = (owners || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');

    if (!base || base.length < 2) {
      base = 'client';
    }

    return (base.slice(0, 10) + Math.floor(1000 + Math.random() * 9000)).toLowerCase();
  };

  const generatePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass.toLowerCase();
  };

  const isBarBatType =
    formData.eventType === 'בר מצוה' ||
    formData.eventType === 'בת מצוה' ||
    formData.eventType === 'בר ובת מצוה' ||
    formData.eventType === 'ברית' ||
    formData.eventType === 'בריתה';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.owners || !formData.eventType) {
      alert('יש למלא שם בעלי השמחה וסוג אירוע');
      return;
    }

    if (formData.useExternalLanding === 'כן' && !formData.externalLandingUrl.trim()) {
      alert('נא להזין קישור לדף הנחיתה החיצוני');
      return;
    }

    setSaving(true);

    const username = generateUsername(formData.owners).toLowerCase();
    const password = generatePassword().toLowerCase();
    const eventId = Date.now();

    const newEvent = {
      id: eventId,
      title: `${formData.hallName || 'אולם'} - ${formData.owners}`,
      owners: formData.owners,
      eventType: formData.eventType,
      rsvpMode: formData.rsvpMode || 'רגיל',
      welcomeLine: formData.welcomeLine || '',
      useExternalLanding: formData.useExternalLanding || 'לא',
      externalLandingUrl: formData.externalLandingUrl || '',
      hallName: formData.hallName,
      city: formData.city,
      date: formData.eventDate
        ? formData.eventDate.split('-').reverse().slice(0, 2).join('/')
        : '01/08',
      fullDate: formData.eventDate,
      eventDate: formData.eventDate,
      time: formData.time,
      groomParents: formData.groomParents,
      brideParents: formData.brideParents,
      email: formData.email,
      price: formData.price,
      deposit: formData.deposit,
      serviceType: formData.serviceType,
      notes: formData.notes,
      isActive: false,
      activatedAt: null,
      username,
      password,
      clientPhone: formData.phone,
    };

    const existing = JSON.parse(localStorage.getItem('myEvents') || '[]');
    localStorage.setItem('myEvents', JSON.stringify([...existing, newEvent]));

    try {
      const { error } = await supabase.from('events').insert({
        id: eventId,
        title: newEvent.title,
        owners: newEvent.owners,
        event_type: newEvent.eventType,
        hall_name: newEvent.hallName,
        city: newEvent.city,
        event_date: formData.eventDate || null,
        full_date: formData.eventDate || null,
        time: newEvent.time || null,
        day: null,
        groom_parents: newEvent.groomParents || null,
        bride_parents: newEvent.brideParents || null,
        email: newEvent.email || null,
        price: newEvent.price || null,
        deposit: newEvent.deposit || null,
        service_type: newEvent.serviceType || null,
        notes: newEvent.notes || null,
        is_active: false,
        credit_link: null,
        has_separation: null,
        has_transport: null,
        seating_arrangement: null,
        qr_code: null,
        guest_notes: null,
        show_seating_link: null,
        sms_service: null,
        steward_service: null,
      });

      if (error) {
        console.warn('Supabase insert error:', error.message);
      } else {
        console.log('✅ נשמר גם ב-Supabase');
      }
    } catch (err) {
      console.warn('Supabase failed, localStorage OK:', err);
    }

    setSaving(false);

    alert(
      `✅ האירוע נוצר (עדיין לא פעיל)\n\nפרטי הכניסה יישלחו ללקוח רק כשתלחץ "הפעל את האירוע" בעריכת האירוע.`
    );
    window.location.href = `/event/${newEvent.id}/edit`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 to-zinc-200 py-12" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800">פתח אירוע חדש</h1>
          <p className="text-slate-500 mt-3">
            האירוע יישמר כלא־פעיל. שליחת פרטי כניסה רק בהפעלה.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-10 space-y-8">
          <div>
            <label className="block text-lg font-semibold mb-2">שם בעלי השמחה</label>
            <input
              type="text"
              name="owners"
              value={formData.owners}
              onChange={handleChange}
              className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
              placeholder="ליעד כהן"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">
              טלפון הלקוח (לשליחת פרטי כניסה בהפעלה)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
              placeholder="050-5270152"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">סוג האירוע</label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
              required
            >
              <option value="">בחר סוג אירוע</option>
              <option value="חתונה">חתונה</option>
              <option value="בר מצוה">בר מצוה</option>
              <option value="בת מצוה">בת מצוה</option>
              <option value="בר ובת מצוה">בר ובת מצוה</option>
              <option value="ברית">ברית</option>
              <option value="בריתה">בריתה</option>
              <option value="כנס">כנס</option>
              <option value="אחר">אחר</option>
            </select>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">
              מצב אישור הגעה (דף נחיתה)
            </label>
            <select
              name="rsvpMode"
              value={formData.rsvpMode}
              onChange={handleChange}
              className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
            >
              <option value="רגיל">רגיל (1–5 וכו׳)</option>
              <option value="2 כפתורים">2 כפתורים — מגיע / לא מגיע</option>
              <option value="3 כפתורים">3 כפתורים — 1 / 2 / לא מגיע</option>
            </select>
          </div>

          {isBarBatType && (
            <div>
              <label className="block text-lg font-semibold mb-2">
                נשמח לראותכם ________
              </label>
              <input
                type="text"
                name="welcomeLine"
                value={formData.welcomeLine}
                onChange={handleChange}
                className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
                placeholder="משפחת כהן / הורי רון"
              />
              <p className="text-sm text-gray-500 mt-1">
                יופיע בהודעות במקום הורי חתן/כלה
              </p>
            </div>
          )}

          <div>
            <label className="block text-lg font-semibold mb-2">דף נחיתה</label>
            <select
              name="useExternalLanding"
              value={formData.useExternalLanding}
              onChange={handleChange}
              className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
            >
              <option value="לא">שלנו (EventPay)</option>
              <option value="כן">חיצוני (של הלקוח)</option>
            </select>
          </div>

          {formData.useExternalLanding === 'כן' && (
            <div>
              <label className="block text-lg font-semibold mb-2">
                קישור לדף הנחיתה של הלקוח
              </label>
              <input
                type="url"
                name="externalLandingUrl"
                value={formData.externalLandingUrl}
                onChange={handleChange}
                className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
                placeholder="https://..."
                dir="ltr"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold mb-2">שם האולם</label>
              <input
                type="text"
                name="hallName"
                value={formData.hallName}
                onChange={handleChange}
                className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2">עיר</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">תאריך האירוע</label>
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">שעה</label>
            <input
              type="text"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
            />
          </div>

          {formData.eventType === 'חתונה' || !formData.eventType ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-semibold mb-2">הורי החתן</label>
                <input
                  type="text"
                  name="groomParents"
                  value={formData.groomParents}
                  onChange={handleChange}
                  className="w-full p-5 border border-gray-300 rounded-2xl"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2">הורי הכלה</label>
                <input
                  type="text"
                  name="brideParents"
                  value={formData.brideParents}
                  onChange={handleChange}
                  className="w-full p-5 border border-gray-300 rounded-2xl"
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-2xl p-4">
              באירוע מסוג <b>{formData.eventType}</b> משתמשים בשדה &quot;נשמח לראותכם&quot;
              (לא חובה למלא הורי חתן/כלה).
            </div>
          )}

          <div>
            <label className="block text-lg font-semibold mb-2">מחיר כולל</label>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
              placeholder="25,000 ₪"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">מקדמה</label>
            <input
              type="text"
              name="deposit"
              value={formData.deposit}
              onChange={handleChange}
              className="w-full p-5 border border-gray-300 rounded-2xl text-lg"
              placeholder="5,000 ₪"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">הערות</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-5 border border-gray-300 rounded-2xl text-lg h-32"
              placeholder="הערות נוספות..."
            />
          </div>

          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-2xl font-bold py-6 px-20 rounded-3xl transition-all"
            >
              {saving ? 'שומר...' : 'יצירת האירוע 🎉'}
            </button>
          </div>

          <p className="text-center text-sm text-slate-400">
            לא נשלחים פרטי כניסה בשלב זה
          </p>
        </form>
      </div>
    </div>
  );
}