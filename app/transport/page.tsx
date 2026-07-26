'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function TransportContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '1';
  // תומך גם ב-guestId וגם ב-ref (מה-SMS)
  const guestRef =
    searchParams.get('guestId') ||
    searchParams.get('ref') ||
    searchParams.get('code') ||
    '';

  const [eventData, setEventData] = useState<any>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [chosenOption, setChosenOption] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

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

    const saved = localStorage.getItem(`transport_options_${eventId}`);
    if (saved) {
      try {
        setOptions(JSON.parse(saved));
      } catch {}
    }

    // אין ref/guestId = מצב מנהל
    if (!guestRef) setIsAdmin(true);
  }, [eventId, guestRef]);

  const updateOption = (id: number, field: 'name' | 'time', value: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  };

  const saveOptions = () => {
    localStorage.setItem(`transport_options_${eventId}`, JSON.stringify(options));
    alert('✅ ההסעות נשמרו בהצלחה');
  };

  const findGuestIndex = (guests: any[], ref: string) => {
    if (!ref || !Array.isArray(guests)) return -1;
    const sc = String(ref).trim();
    return guests.findIndex((g: any) => {
      if (!g) return false;
      if (g.id != null && String(g.id) === sc) return true;
      if (g.inviteCode != null && String(g.inviteCode) === sc) return true;
      if (g.code != null && String(g.code) === sc) return true;
      if (g.phone) {
        const p = String(g.phone).replace(/\D/g, '');
        const c = sc.replace(/\D/g, '');
        if (p && c && p === c) return true;
      }
      return false;
    });
  };

  const handleChoose = (option: any) => {
    const transportText =
      option.id === 7
        ? 'לא תודה אגיע עצמאית'
        : `${option.name}${option.time ? ' - ' + option.time : ''}`;

    if (guestRef) {
      const key = `guests_event_${eventId}`;
      let guests = JSON.parse(localStorage.getItem(key) || '[]');
      const idx = findGuestIndex(guests, guestRef);
      if (idx !== -1) {
        guests[idx] = { ...guests[idx], transportation: transportText };
        localStorage.setItem(key, JSON.stringify(guests));
      }
    }

    setChosenOption(transportText);
    setShowThankYou(true);
  };

  const activeOptions = options.filter((o) => o.name.trim() !== '');

  if (showThankYou) {
    return (
      <div className="min-h-screen bg-[#f8f1e3] flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="text-7xl mb-6">🙏</div>
          <h2 className="text-3xl font-bold text-[#3f2a1e] mb-4">תודה על בחירתך!</h2>
          <p className="text-xl text-gray-700 mb-8">הבחירה נרשמה בהצלחה.</p>

          <div className="bg-[#f8f1e3] rounded-2xl p-5 mb-8">
            <p className="text-lg font-medium text-[#5c4033]">{chosenOption}</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== מצב מנהל =====
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
          <p className="text-2xl text-gray-800">{eventData?.owners || 'האירוע'}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold mb-2">בחר הסעה</h2>
            <p className="text-gray-600">לחץ על האופציה המתאימה לך</p>
          </div>

          {activeOptions.length === 0 ? (
            <p className="text-center text-gray-500 text-lg py-10">
              עדיין לא הוגדרו הסעות לאירוע זה
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeOptions.map((option) => (
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

              <button
                onClick={() => handleChoose({ id: 7, name: 'לא תודה אגיע עצמאית', time: '' })}
                className="p-8 rounded-3xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-right transition-all active:scale-[0.985]"
              >
                <div className="text-2xl font-bold text-gray-900">לא תודה אגיע עצמאית</div>
              </button>
            </div>
          )}
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