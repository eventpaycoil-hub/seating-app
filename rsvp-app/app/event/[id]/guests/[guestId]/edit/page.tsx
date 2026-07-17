'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditGuestPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const guestId = params?.guestId as string;

  const [guest, setGuest] = useState<any>({});
  const [event, setEvent] = useState<any>({});
  const [shonut, setShonut] = useState('');

  useEffect(() => {
    const guestsKey = `guests_event_${eventId}`;
    const savedGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    let foundGuest = savedGuests.find((g: any) => g.id.toString() === guestId);

    if (foundGuest) {
      const status = foundGuest.confirmed;
      const isNumber = status && !isNaN(Number(status)) && Number(status) >= 1 && Number(status) <= 16;

      if (!status || status === '' || status === 'לא מגיע' || !isNumber) {
        foundGuest = { ...foundGuest, confirmed: 'לא ידוע', count: 0 };
        const updated = savedGuests.map((g: any) =>
          g.id.toString() === guestId ? foundGuest : g
        );
        localStorage.setItem(guestsKey, JSON.stringify(updated));
      }
      setGuest(foundGuest);
    } else {
      setGuest({ confirmed: 'לא ידוע', count: 0 });
    }

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) setEvent(currentEvent);
  }, [eventId, guestId]);

  const addToNotes = (text: string) => {
    const date = new Date().toLocaleString('he-IL');
    const newNote = `${text} - ${date}`;
    setGuest((prev: any) => ({
      ...prev,
      notes: prev.notes ? `${prev.notes}\n${newNote}` : newNote
    }));
  };

  // === תיקון: לא דורסים quantity ===
  const resetToUnknown = () => {
    const updatedGuest = { 
      ...guest, 
      count: 0, 
      confirmed: 'לא ידוע'
      // quantity נשאר כמו שהוא
    };
    setGuest(updatedGuest);

    const guestsKey = `guests_event_${eventId}`;
    let savedGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    savedGuests = savedGuests.map((g: any) => g.id.toString() === guestId ? updatedGuest : g);
    localStorage.setItem(guestsKey, JSON.stringify(savedGuests));
  };

  const setCountAndConfirm = (num: number) => {
    const updatedGuest = { 
      ...guest, 
      count: num, 
      confirmed: num.toString()
      // quantity נשאר כמו שהוא (ההערכה המקורית)
    };
    setGuest(updatedGuest);

    const guestsKey = `guests_event_${eventId}`;
    let savedGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    savedGuests = savedGuests.map((g: any) => g.id.toString() === guestId ? updatedGuest : g);
    localStorage.setItem(guestsKey, JSON.stringify(savedGuests));

    router.push(`/event/${eventId}/guests`);
  };

  const markAsNotComing = () => {
    const updatedGuest = { 
      ...guest, 
      count: 0, 
      confirmed: 'לא מגיע'
      // quantity נשאר כמו שהוא
    };
    setGuest(updatedGuest);

    const guestsKey = `guests_event_${eventId}`;
    let savedGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    savedGuests = savedGuests.map((g: any) => g.id.toString() === guestId ? updatedGuest : g);
    localStorage.setItem(guestsKey, JSON.stringify(savedGuests));

    router.push(`/event/${eventId}/guests`);
  };

  const saveAndGoBack = () => {
    const guestsKey = `guests_event_${eventId}`;
    let savedGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    
    const updatedGuests = savedGuests.map((g: any) =>
      g.id.toString() === guestId ? guest : g
    );

    localStorage.setItem(guestsKey, JSON.stringify(updatedGuests));
    router.push(`/event/${eventId}/guests`);
  };

  const callPhone = () => window.open(`tel:${guest.phone}`);

  const quickActions = [
    "אין מענה", "תא קולי", "שיחה ממתינה", "מס לא מחובר",
    "טעות במספר", "להתקשר מחדש", "תחילת שבוע", "יאושר בהודעה",
    "אפס הערה", "ספרה מיותרת", "חסרה ספרה", "להתקשר בעוד ימים",
    "יחזרו אלינו", "אירוע אחר", "להתקשר ביום א", "להתקשר ביום ב",
    "להתקשר ביום ג", "להתקשר ביום ד", "להתקשר ביום ה", "ההודעה נמסרה",
    "לא יודע עדיין", "לא יודעת עדיין", "נשלח וואצאפ"
  ];

  const getDayOfWeek = () => {
    if (event.day && event.day.length > 3) return event.day;
    if (event.fullDate) {
      try {
        const d = new Date(event.fullDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('he-IL', { weekday: 'long' });
        }
      } catch {}
    }
    return event.day || '';
  };

  return (
    <div className="min-h-screen bg-[#f5f0e6] p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-sm mb-4 inline-block">← חזרה לרשימה</Link>

        <div className="flex flex-col lg:flex-row gap-5 mb-6">
          <div onClick={callPhone} className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded-3xl p-7 flex flex-col items-center justify-center shadow-lg w-full lg:w-[420px] flex-shrink-0">
            <div className="text-base opacity-80">טלפון</div>
            <div className="text-5xl font-bold tracking-widest mt-1">{guest.phone}</div>
            <div className="text-xs mt-2 opacity-70">לחץ להתקשר ב-Zoiper</div>
          </div>

          <div className="flex-1 bg-white rounded-3xl p-6 shadow text-sm">
            <div className="text-2xl font-bold mb-4">{guest.name}</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <div><span className="font-semibold">בעלי השמחה:</span> {event.owners}</div>
              <div><span className="font-semibold">תאריך:</span> {event.date}</div>
              <div><span className="font-semibold">אולם:</span> {event.hallName || event.venue}</div>
              <div><span className="font-semibold">עיר:</span> {event.city}</div>
              <div><span className="font-semibold">שעה:</span> {event.time}</div>
              <div><span className="font-semibold">יום:</span> {getDayOfWeek()}</div>
              <div className="col-span-2 pt-2 border-t text-blue-700">הורי חתן: {event.groomParents}</div>
              <div className="col-span-2 text-blue-700">הורי כלה: {event.brideParents}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow mb-6">
          <div className="font-bold mb-4 text-lg">פעולות מהירות</div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 text-sm">
            {quickActions.map((text, i) => (
              <button key={i} onClick={() => addToNotes(text)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-2.5 rounded-xl active:scale-[0.98]">
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow">
            <div className="text-sm text-gray-500 mb-3">כמות אנשים</div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={resetToUnknown}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-lg border-2 transition-all cursor-pointer ${guest.confirmed === 'לא ידוע' 
                  ? 'bg-amber-500 text-white border-amber-600 scale-[1.04] shadow-lg' 
                  : 'bg-white border-gray-300 hover:border-amber-400 hover:bg-amber-50'}`}
              >
                לא ידוע
              </button>

              <button
                onClick={markAsNotComing}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-lg border-2 transition-all cursor-pointer ${guest.confirmed === 'לא מגיע' 
                  ? 'bg-red-500 text-white border-red-600 scale-[1.04] shadow-lg' 
                  : 'bg-white border-gray-300 hover:border-red-400 hover:bg-red-50'}`}
              >
                לא מגיע
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 16 }, (_, i) => i + 1).map(num => (
                <button key={num} onClick={() => setCountAndConfirm(num)} className={`w-14 h-14 rounded-full text-xl font-bold border-2 transition ${guest.count === num ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300'}`}>
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-3xl p-5 shadow">
              <label className="block text-sm text-gray-500 mb-2">שונות</label>
              <select value={shonut} onChange={(e) => setShonut(e.target.value)} className="w-full p-3 border rounded-2xl">
                <option value="">בחר</option>
                <option value="צמחוני">צמחוני</option>
                <option value="ילדים">ילדים</option>
                <option value="נכות / עזרה">נכות / עזרה</option>
              </select>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow">
              <label className="block text-sm text-gray-500 mb-2">הערות</label>
              <textarea 
                value={guest.notes || ''} 
                onChange={(e) => setGuest({ ...guest, notes: e.target.value })} 
                className="w-full h-28 p-4 border rounded-2xl text-sm" 
                placeholder="הערות..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button 
            onClick={saveAndGoBack} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-20 py-4 rounded-2xl text-xl font-medium"
          >
            עדכן והמשך
          </button>
        </div>
      </div>
    </div>
  );
}