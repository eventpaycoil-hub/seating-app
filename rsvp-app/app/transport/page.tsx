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
  const [isAdmin, setIsAdmin] = useState(false);

  // אפשרויות הסעה (ניתנות לעריכה)
  const [options, setOptions] = useState([
    { id: 1, name: '', time: '' },
    { id: 2, name: '', time: '' },
    { id: 3, name: '', time: '' },
    { id: 4, name: '', time: '' },
    { id: 5, name: '', time: '' },
    { id: 6, name: '', time: '' },
  ]);

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const current = events.find((e: any) => e.id.toString() === eventId.toString());
    if (current) setEventData(current);

    // טעינת הגדרות הסעות של האירוע
    const saved = localStorage.getItem(`transport_options_${eventId}`);
    if (saved) {
      try {
        setOptions(JSON.parse(saved));
      } catch {}
    }

    // אם אין guestId = מצב מנהל (עריכת שמות)
    if (!guestId) setIsAdmin(true);
  }, [eventId, guestId]);

  const updateOption = (id: number, field: 'name' | 'time', value: string) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const saveOptions = () => {
    localStorage.setItem(`transport_options_${eventId}`, JSON.stringify(options));
    alert('✅ ההסעות נשמרו בהצלחה');
  };

  const handleChoose = (option: any) => {
    const transportText = option.id === 7 
      ? "לא תודה אגיע עצמאית" 
      : `${option.name}${option.time ? ' - ' + option.time : ''}`;

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

  // רק הסעות שיש להן שם
  const activeOptions = options.filter(o => o.name.trim() !== '');

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

  // ===== מצב מנהל - עריכת שמות הסעות =====
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#f8f1e3] py-12" dir="rtl">
        <div className="max-w-3xl mx-auto px-6">
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline mb-8 inline-block">
            ← חזרה לרשימת מוזמנים
          </Link>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2">הגדרת הסעות</h1>
            <p className="text-xl text-gray-700">{eventData?.owners || 'אירוע'}</p>
            <p className="text-gray-500 mt-2">רשום רק את ההסעות שאתה צריך. השאר ריק לא יופיע.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-5">
            {options.map((opt) => (
              <div key={opt.id} className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                  {opt.id}
                </div>
                <input
                  type="text"
                  placeholder={`שם הסעה ${opt.id} (למשל: הסעה מתל אביב)`}
                  value={opt.name}
                  onChange={(e) => updateOption(opt.id, 'name', e.target.value)}
                  className="flex-1 p-4 border border-gray-300 rounded-2xl text-lg"
                />
                <input
                  type="text"
                  placeholder="שעה"
                  value={opt.time}
                  onChange={(e) => updateOption(opt.id, 'time', e.target.value)}
                  className="w-28 p-4 border border-gray-300 rounded-2xl text-lg text-center"
                />
              </div>
            ))}

            <div className="pt-6 border-t">
              <button
                onClick={saveOptions}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl text-xl font-bold"
              >
                💾 שמור הסעות
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== מסך בחירה למוזמן =====
  return (
    <div className="min-h-screen bg-[#f8f1e3] py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-6">
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
            {activeOptions.map(option => (
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

            {/* תמיד מופיע */}
            <button
              onClick={() => handleChoose({ id: 7, name: "לא תודה אגיע עצמאית", time: "" })}
              className="p-8 rounded-3xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-right transition-all active:scale-[0.985]"
            >
              <div className="text-2xl font-bold text-gray-900">לא תודה אגיע עצמאית</div>
            </button>
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