'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditGuestPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const guestId = params?.guestId as string;

  const [guest, setGuest] = useState({
    id: guestId,
    name: "משפחת כהן",
    phone: "0501234567",
    count: 4,
    group: "אשכנזי",
    notes: "",
    confirmed: ""
  });

  const [event, setEvent] = useState({
    name: "בר המצווה של נתן לוי",
    date: "29/07/2026",
    venue: "אולם ",
    city: "עיר",
    day: "יום רביעי",
    time: "19:30",
    owners: "שלומי ויעל",
    groomParents: "עליזה וחיים יעקובי",
    brideParents: "אתי ומנשה (צ'יקו) חורי"
  });

  const [shonut, setShonut] = useState('');

  useEffect(() => {
    const guestsKey = `guests_event_${eventId}`;
    const savedGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    const foundGuest = savedGuests.find(g => g.id.toString() === guestId);
    if (foundGuest) setGuest(foundGuest);

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find(e => e.id.toString() === eventId.toString());
    if (currentEvent) setEvent(currentEvent);
  }, [eventId, guestId]);

  const addToNotes = (text: string) => {
    const date = new Date().toLocaleString('he-IL');
    const newNote = `${text} - ${date}`;
    setGuest(prev => ({
      ...prev,
      notes: prev.notes ? `${prev.notes}\n${newNote}` : newNote
    }));
  };

  const setCountAndConfirm = (num: number) => {
    const updatedGuest = { ...guest, count: num, confirmed: num.toString() };
    setGuest(updatedGuest);

    const guestsKey = `guests_event_${eventId}`;
    let savedGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    savedGuests = savedGuests.map(g => g.id.toString() === guestId ? updatedGuest : g);
    localStorage.setItem(guestsKey, JSON.stringify(savedGuests));

    // מעבר למוזמן הבא שלא אישר עדיין
    const nextGuest = savedGuests.find(g => 
      g.id.toString() !== guestId && 
      g.phone && 
      (!g.confirmed || g.confirmed === '')
    );

    if (nextGuest) {
      router.push(`/event/${eventId}/guests/${nextGuest.id}/edit`);
    } else {
      router.push(`/event/${eventId}/guests`);
    }
  };

  const callPhone = () => {
    window.open(`tel:${guest.phone}`);
  };

  const quickActions = [
    "אין מענה", "תא קולי", "שיחה ממתינה", "מס לא מחובר נא לתקן",
    "טעות במספר נא לתקן", "להתקשר מחר", "להתקשר בתחילת שבוע הבא",
    "יאושר בהודעה כשתהיה תשובה", "אפס הערה", "ספרה מיותרת נא לתקן",
    "חסרה ספרה נא לתקן", "להתקשר בעוד מספר ימים", "יחזרו אלינו ויתנו תשובה",
    "יש לנו אירוע אחר לא נגיע", "להתקשר ביום א", "להתקשר ביום ב",
    "להתקשר ביום ג", "להתקשר ביום ד", "להתקשר ביום ה",
    "ההודעה נמסרה", "לא יודע עדיין", "לא יודעת עדיין", "נשלח וואצאפ"
  ];

  return (
    <div className="min-h-screen bg-[#f5f0e6] p-8" dir="rtl">   {/* רקע שמנת כהה יותר */}
      <div className="max-w-7xl mx-auto">
        <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline mb-6 inline-block">← חזרה לרשימה</Link>

        <div className="flex flex-col lg:flex-row gap-8 mb-10 items-start">
          {/* כפתור טלפון כחול - שמאל למעלה */}
          <div onClick={callPhone} className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl w-80 flex-shrink-0">
            <div className="text-lg opacity-80 mb-2">טלפון</div>
            <div className="text-6xl font-bold tracking-widest">{guest.phone}</div>
            <div className="text-sm mt-4 opacity-75">לחץ להתקשר ב-Zoiper</div>
          </div>

          {/* פרטי האורח + האירוע */}
          <div className="flex-1 bg-white rounded-3xl p-8 shadow">
            <div className="text-3xl font-bold mb-6">{guest.name}</div>
            <div className="space-y-4 text-[17px]">
              <div><span className="font-semibold">שם בעלי השמחה:</span> {event.owners}</div>
              <div><span className="font-semibold">תאריך:</span> {event.date}</div>
              <div><span className="font-semibold">אולם:</span> {event.venue}</div>
              <div><span className="font-semibold">עיר:</span> {event.city}</div>
              <div><span className="font-semibold">יום:</span> {event.day}</div>
              <div><span className="font-semibold">שעה:</span> {event.time}</div>
              <div className="pt-4 border-t text-blue-700 font-medium">הורי חתן: {event.groomParents}</div>
              <div className="text-blue-700 font-medium">הורי כלה: {event.brideParents}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* צד שמאל */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow">
              <div className="text-sm text-gray-500 mb-4">כמות אנשים (לחיצה מאשרת ומעבירה)</div>
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 16 }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => setCountAndConfirm(num)}
                    className={`w-16 h-16 rounded-full text-2xl font-bold border-2 transition ${guest.count === num ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300 hover:border-emerald-400'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* שונות */}
            <div className="bg-white rounded-3xl p-8 shadow">
              <label className="block text-sm text-gray-500 mb-3">שונות</label>
              <select 
                value={shonut} 
                onChange={(e) => setShonut(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-2xl text-lg"
              >
                <option value="">בחר אפשרות</option>
                <option value="צמחוני">צמחוני</option>
                <option value="ילדים">ילדים</option>
                <option value="נכות / עזרה">נכות / עזרה</option>
              </select>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow">
              <div className="text-sm text-gray-500 mb-3">הערות</div>
              <textarea 
                value={guest.notes} 
                onChange={(e) => setGuest({ ...guest, notes: e.target.value })} 
                className="w-full h-44 p-6 border border-gray-200 rounded-3xl text-lg"
                placeholder="הערות + פעולות טלפון..."
              />
            </div>

            {/* כפתור עדכן */}
            <div className="flex justify-center pt-6">
              <button 
                onClick={() => router.push(`/event/${eventId}/guests`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-16 py-4 rounded-2xl text-xl font-medium"
              >
                עדכן והמשך
              </button>
            </div>
          </div>

          {/* צד ימין - פעולות מהירות */}
          <div className="bg-white rounded-3xl p-8 shadow">
            <h3 className="font-bold text-xl mb-6">פעולות מהירות</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {quickActions.map(text => (
                <button 
                  key={text} 
                  onClick={() => addToNotes(text)} 
                  className="bg-pink-100 hover:bg-pink-200 text-pink-700 py-4 rounded-2xl text-sm"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}