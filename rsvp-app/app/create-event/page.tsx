'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function CreateEventPage() {
  const [formData, setFormData] = useState({
    eventType: '',
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
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateUsername = (owners: string) => {
    return owners.replace(/\s+/g, '').toLowerCase().slice(0, 12) + Math.floor(1000 + Math.random() * 9000);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.owners || !formData.eventType) {
      alert("יש למלא שם בעלי השמחה וסוג אירוע");
      return;
    }

    const username = generateUsername(formData.owners);
    const password = generatePassword();

    const newEvent = {
      id: Date.now(),
      title: `${formData.hallName || 'אולם'} - ${formData.owners}`,
      owners: formData.owners,
      eventType: formData.eventType,
      hallName: formData.hallName,
      city: formData.city,
      date: formData.eventDate ? formData.eventDate.split('-').reverse().slice(0,2).join('/') : "01/08",
      fullDate: formData.eventDate,
      time: formData.time,
      groomParents: formData.groomParents,
      brideParents: formData.brideParents,
      price: formData.price,
      deposit: formData.deposit,
      serviceType: formData.serviceType,
      notes: formData.notes,
      isActive: true,
      username: username,
      password: password,
      clientPhone: formData.phone
    };

    const existing = JSON.parse(localStorage.getItem('myEvents') || '[]');
    localStorage.setItem('myEvents', JSON.stringify([...existing, newEvent]));

    const welcomeMsg = `שלום ${formData.owners}!\n\nהאירוע שלכם נוצר בהצלחה!\n\nשם משתמש: ${username}\nסיסמה: ${password}\n\nכנסו כאן: http://localhost:3000/event/${newEvent.id}\n\nבהצלחה רבה! EventPay`;

    const whatsappUrl = `https://wa.me/972${(formData.phone || '0505270152').replace(/\D/g, '').slice(1)}?text=${encodeURIComponent(welcomeMsg)}`;
    window.open(whatsappUrl, '_blank');

    alert(`🎉 האירוע נוצר!\n\nשם משתמש: ${username}\nסיסמה: ${password}\n\nנפתח WhatsApp`);
    window.location.href = '/events';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 to-zinc-200 py-12" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800">פתח אירוע חדש</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-10 space-y-8">
          <div>
            <label className="block text-lg font-semibold mb-2">שם בעלי השמחה</label>
            <input type="text" name="owners" value={formData.owners} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl text-lg" placeholder="ליעד כהן" required />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">טלפון הלקוח (לשליחת פרטי כניסה)</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl text-lg" placeholder="050-5270152" />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">סוג האירוע</label>
            <select name="eventType" value={formData.eventType} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl text-lg" required>
              <option value="">בחר סוג אירוע</option>
              <option value="חתונה">חתונה</option>
              <option value="בר מצוה">בר מצוה</option>
              <option value="בת מצוה">בת מצוה</option>
              <option value="ברית">ברית</option>
              <option value="בריתה">בריתה</option>
              <option value="כנס">כנס</option>
              <option value="אחר">אחר</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold mb-2">שם האולם</label>
              <input type="text" name="hallName" value={formData.hallName} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl text-lg" />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2">עיר</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl text-lg" />
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">תאריך האירוע</label>
            <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl text-lg" required />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">שעה</label>
            <input type="text" name="time" value={formData.time} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl text-lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold mb-2">הורי החתן / בר מצוה</label>
              <input type="text" name="groomParents" value={formData.groomParents} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl" />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2">הורי הכלה</label>
              <input type="text" name="brideParents" value={formData.brideParents} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl" />
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">מחיר כולל</label>
            <input type="text" name="price" value={formData.price} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl text-lg" placeholder="25,000 ₪" />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">מקדמה</label>
            <input type="text" name="deposit" value={formData.deposit} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl text-lg" placeholder="5,000 ₪" />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">הערות</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full p-5 border border-gray-300 rounded-2xl text-lg h-32" placeholder="הערות נוספות..." />
          </div>

          <div className="flex justify-center pt-6">
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-2xl font-bold py-6 px-20 rounded-3xl transition-all">
              יצירת האירוע + שליחת פרטי כניסה 🎉
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}