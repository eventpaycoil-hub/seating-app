// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.id || "1";

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
  });

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
   const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) {
      setFormData(prev => ({
        ...prev,
        ...currentEvent,
        time: currentEvent.time || '19:30',
      }));
    }
  }, [eventId]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNoteChange = (index: number, value: string) => {
    const newNotes = [...formData.miscellaneousNotes];
    newNotes[index] = value;
    setFormData({ ...formData, miscellaneousNotes: newNotes });
  };

  const toggleActivate = () => {
    const newStatus = !formData.isActive;
    const updatedData = {
      ...formData,
      isActive: newStatus,
   activatedAt: newStatus ? new Date().toISOString() : (null as any),
    };
    setFormData(updatedData);

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const updatedEvents = events.map((e: any) =>
      e.id.toString() === eventId ? { ...e, ...updatedData } : e
    );
    localStorage.setItem('myEvents', JSON.stringify(updatedEvents));

    alert(newStatus ? '🎉 האירוע הופעל בהצלחה!' : 'האירוע הושבת.');
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    const updatedEvent = {
      ...formData,
     id: parseInt(Array.isArray(eventId) ? eventId[0] : eventId || '0'),
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

  const eventTypes = ["חתונה", "בר מצוה", "בת מצוה", "בר ובת מצוה", "ברית", "בריתה", "כנס", "אחר", "אחר 2", "אחר 3", "אירוע עם דף נחיתה פנימי"];
  const serviceTypes = ["אישורי הגעה בלבד", "אישורי הגעה וסידורי הושבה", "אישורי הגעה סידורי הושבה ושירות מתנה באשראי", "ניהול אירוע מלא"];

  return (
    <div className="min-h-screen bg-[#f5e8c7] p-8" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-10">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-[#4a2c0f]">עריכת פרטי אירוע - {formData.owners}</h1>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline">← חזרה לרשימת מוזמנים</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* הפעלת אירוע */}
          <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-xl">סטטוס אירוע</div>
                <div className={`text-lg mt-1 ${formData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.isActive ? '✅ האירוע פעיל' : '⏳ האירוע לא פעיל'}
                </div>
              </div>
              <button 
                type="button"
                onClick={toggleActivate}
                className={`px-10 py-4 rounded-2xl text-xl font-bold transition-all ${formData.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
              >
                {formData.isActive ? '⚠️ השבת את האירוע' : '🚀 הפעל את האירוע'}
              </button>
            </div>
          </div>

          {/* שם בעלי השמחה */}
          <div>
            <label className="block text-sm font-medium mb-2">שם בעלי השמחה:</label>
            <input type="text" name="owners" value={formData.owners} onChange={handleChange} className="w-full p-4 border rounded-2xl text-lg" />
          </div>

          {/* סוג האירוע */}
          <div>
            <label className="block text-sm font-medium mb-2">סוג האירוע:</label>
            <select name="eventType" value={formData.eventType} onChange={handleChange} className="w-full p-4 border rounded-2xl text-lg">
              {eventTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* שם האולם + עיר */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">שם האולם:</label>
              <input type="text" name="hallName" value={formData.hallName} onChange={handleChange} className="w-full p-4 border rounded-2xl text-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">עיר:</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-4 border rounded-2xl text-lg" />
            </div>
          </div>

          {/* תאריך + שעה */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {/* @ts-ignore */}
              <label className="block text-sm font-medium mb-2">תאריך האירוע:</label>
              <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} className="w-full p-4 border rounded-2xl text-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">שעת האירוע:</label>
              <input type="text" name="time" value={formData.time} onChange={handleChange} className="w-full p-4 border rounded-2xl text-lg" placeholder="19:30" />
            </div>
          </div>

          {/* הורים */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">הורי החתן:</label>
              <input type="text" name="groomParents" value={formData.groomParents} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">הורי הכלה:</label>
              <input type="text" name="brideParents" value={formData.brideParents} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
            </div>
          </div>

          {/* קישור אשראי */}
          <div>
            <label className="block text-sm font-medium mb-2">קישור לאשראי (מתנה):</label>
            <input type="url" name="creditLink" value={formData.creditLink} onChange={handleChange} className="w-full p-4 border rounded-2xl text-lg" placeholder="https://pay.example.com" />
          </div>

          {/* מחיר + מקדמה */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">מחיר האירוע (₪)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">מקדמה ששולמה (₪)</label>
              <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
            </div>
          </div>

          {/* סוג השירות */}
          <div>
            <label className="block text-sm font-medium mb-2">סוג השירות:</label>
            <select name="serviceType" value={formData.serviceType} onChange={handleChange} className="w-full p-4 border rounded-2xl">
              {serviceTypes.map((type, i) => <option key={i} value={type}>{type}</option>)}
            </select>
          </div>

          {/* כן/לא */}
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
  ].map((field) => (
    <label key={field.name} className="flex items-center gap-3 text-lg">
      {/* @ts-ignore */}
      <input 
        type="checkbox" 
        checked={formData[field.name as keyof typeof formData] === 'כן'} 
        onChange={() => setFormData({
          ...formData, 
          [field.name]: formData[field.name as keyof typeof formData] === 'כן' ? 'לא' : 'כן'
        })} 
      />
      {field.label}
    </label>
  ))}
</div>

          <div className="flex justify-center pt-8">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-16 py-5 rounded-2xl text-2xl font-medium">
              שמור שינויים
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}