'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export default function TransportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get('eventId') || '1';
  const guestId = searchParams.get('guestId'); // אם באים ממוזמן ספציפי

  const [eventData, setEventData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [customNote, setCustomNote] = useState('');

  const [options] = useState([
    { id: 1, name: "הסעה מס 1 - מדימונה", time: "17:30" },
    { id: 2, name: "הסעה מס 2 - אשדוד", time: "18:00" },
    { id: 3, name: "הסעה מס 3 - באר שבע", time: "17:45" },
    { id: 4, name: "הסעה מס 4 - תל אביב", time: "16:30" },
    { id: 5, name: "הסעה מס 5 - ירושלים", time: "17:15" },
    { id: 6, name: "הסעה מס 6 - חיפה", time: "16:00" },
  ]);

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const current = events.find(e => e.id.toString() === eventId.toString());
    if (current) setEventData(current);
  }, [eventId]);

  const handleSelect = (option) => {
    setSelectedOption(option);
  };

  const submitChoice = () => {
    if (!selectedOption) return alert("בחר הסעה");

    const transportText = `${selectedOption.name} - ${selectedOption.time}`;

    // שמירה ב-localStorage של המוזמנים
    const key = `guests_event_${eventId}`;
    let guests = JSON.parse(localStorage.getItem(key) || '[]');

    if (guestId) {
      // עדכון מוזמן ספציפי
      guests = guests.map(g => g.id.toString() === guestId ? {...g, transport: transportText} : g);
    } else {
      // אם אין guestId - שמירה כללית (לפי שם לדוגמא)
      alert(`נשמר: ${transportText}\n(בפועל זה יחובר למוזמן ספציפי)`);
    }

    localStorage.setItem(key, JSON.stringify(guests));

    alert(`✅ נרשמת להסעה: ${selectedOption.name}`);
    router.push(`/event/${eventId}/guests`);
  };

  return (
    <div className="min-h-screen bg-[#f8f1e3] py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-6">
        <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline mb-8 inline-block">← חזרה לרשימת מוזמנים</Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">הסעות לאירוע</h1>
          <p className="text-2xl text-gray-800">{eventData?.owners || "שלומי ויעל"}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold mb-4">תרצו להצטרף להסעה?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {options.map(option => (
              <div
                key={option.id}
                onClick={() => handleSelect(option)}
                className={`p-8 rounded-3xl border-2 cursor-pointer transition-all hover:shadow-md ${selectedOption?.id === option.id ? 'border-[#d4a017] bg-[#fff8e1]' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="text-2xl font-bold mb-2 text-gray-900">{option.name}</div>
                <div className="text-gray-600 text-lg">יציאה בשעה {option.time}</div>
              </div>
            ))}
          </div>

          {selectedOption && (
            <div className="mt-12">
              <label className="block text-lg font-medium mb-3">הערה נוספת</label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full h-32 p-5 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#d4a017]"
                placeholder="למשל: אני צריך כיסא בטיחות..."
              />
            </div>
          )}

          <button
            onClick={submitChoice}
            disabled={!selectedOption}
            className="mt-10 w-full bg-[#d4a017] hover:bg-[#c48f10] disabled:bg-gray-400 text-white py-6 rounded-3xl text-xl font-bold transition-all"
          >
            {selectedOption ? 'אישור הרשמה להסעה' : 'בחר הסעה'}
          </button>
        </div>
      </div>
    </div>
  );
}