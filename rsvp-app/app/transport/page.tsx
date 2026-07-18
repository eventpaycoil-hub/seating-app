'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function TransportContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '1';
  const guestId = searchParams.get('guestId');

  const [eventData, setEventData] = useState<any>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [chosenOption, setChosenOption] = useState('');

  const options = [
    { id: 1, name: "הסעה מס 1 - מדימונה", time: "17:30" },
    { id: 2, name: "הסעה מס 2 - אשדוד", time: "18:00" },
    { id: 3, name: "הסעה מס 3 - באר שבע", time: "17:45" },
    { id: 4, name: "הסעה מס 4 - תל אביב", time: "16:30" },
    { id: 5, name: "הסעה מס 5 - ירושלים", time: "17:15" },
    { id: 6, name: "הסעה מס 6 - חיפה", time: "16:00" },
    { id: 7, name: "לא תודה אגיע עצמאית", time: "" },
  ];

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const current = events.find((e: any) => e.id.toString() === eventId.toString());
    if (current) setEventData(current);
  }, [eventId]);

  const handleChoose = (option: any) => {
    const transportText = option.id === 7 
      ? "לא תודה אגיע עצמאית" 
      : `${option.name} - ${option.time}`;

    // שמירה אצל המוזמן
    if (guestId) {
      const key = `guests_event_${eventId}`;
      let guests = JSON.parse(localStorage.getItem(key) || '[]');
      guests = guests.map((g: any) =>
        g.id.toString() === guestId ? { ...g, transportation: transportText } : g
      );
      localStorage.setItem(key, JSON.stringify(guests));
    }

    setChosenOption(transportText);
    setShowThankYou(true);
  };

  // מסך תודה
  if (showThankYou) {
    return (
      <div className="min-h-screen bg-[#f8f1e3] flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="text-7xl mb-6">🙏</div>
          <h2 className="text-3xl font-bold text-[#3f2a1e] mb-4">תודה על בחירתך!</h2>
          <p className="text-xl text-gray-700 mb-8">הבחירה נרשמה בהצלחה באירוע.</p>
          
          <div className="bg-[#f8f1e3] rounded-2xl p-5 mb-8">
            <p className="text-lg font-medium text-[#5c4033]">{chosenOption}</p>
          </div>

          <Link 
            href={`/event/${eventId}/guests`} 
            className="inline-block bg-[#3f2a1e] hover:bg-[#2c2118] text-white px-10 py-4 rounded-2xl text-lg font-medium transition-all"
          >
            חזרה לרשימת מוזמנים
          </Link>
        </div>
      </div>
    );
  }

  // מסך בחירת הסעה
  return (
    <div className="min-h-screen bg-[#f8f1e3] py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-6">
        <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline mb-8 inline-block">
          ← חזרה לרשימת מוזמנים
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">הסעות לאירוע</h1>
          <p className="text-2xl text-gray-800">{eventData?.owners || "שלומי ויעל"}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold mb-2">בחר הסעה</h2>
            <p className="text-gray-600">לחץ על האופציה המתאימה לך</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {options.map(option => (
              <button
                key={option.id}
                onClick={() => handleChoose(option)}
                className="p-8 rounded-3xl border-2 border-gray-200 hover:border-[#d4a017] hover:bg-[#fff8e1] text-right transition-all active:scale-[0.985]"
              >
                <div className="text-2xl font-bold text-gray-900 mb-1">{option.name}</div>
                {option.time && (
                  <div className="text-gray-600 text-lg">יציאה בשעה {option.time}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xl">טוען...</div>}>
      <TransportContent />
    </Suspense>
  );
}