'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase.js';

function TransportContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '1';
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

    if (!guestRef) setIsAdmin(true);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('owners, transport_options, has_transport')
          .eq('id', Number(eventId))
          .maybeSingle();

        if (error) {
          console.warn('transport load failed', error);
          return;
        }
        if (data?.owners) {
          setEventData((prev: any) => ({ ...(prev || {}), owners: data.owners }));
        }
        if (data?.transport_options) {
          const list = Array.isArray(data.transport_options)
            ? data.transport_options
            : JSON.parse(data.transport_options || '[]');
          if (Array.isArray(list) && list.length > 0) {
            setOptions(list);
            localStorage.setItem(`transport_options_${eventId}`, JSON.stringify(list));
          }
        }
      } catch (e) {
        console.warn('transport supabase', e);
      }
    })();
  }, [eventId, guestRef]);

  const updateOption = (id: number, field: 'name' | 'time', value: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  };

  const saveOptions = async () => {
    localStorage.setItem(`transport_options_${eventId}`, JSON.stringify(options));
    try {
      const { error } = await supabase
        .from('events')
        .update({ transport_options: options })
        .eq('id', Number(eventId));
      if (error) {
        console.warn(error);
        alert('נשמר במכשיר, אבל נכשל ב-Supabase: ' + error.message);
        return;
      }
      alert('✅ ההסעות נשמרו בהצלחה');
    } catch (e: any) {
      alert('נשמר במכשיר בלבד: ' + (e?.message || ''));
    }
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

  const handleChoose = async (option: any) => {
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

        try {
          const g = guests[idx];
          await supabase
            .from('guests')
            .update({ transportation: transportText })
            .eq('id', g.id);
        } catch (e) {
          console.warn('save transport to supabase failed', e);
        }
      }
    }

    setChosenOption(transportText);
    setShowThankYou(true);
  };

  const activeOptions = options.filter((o) => o.name && o.name.trim() !== '');

  if (showThankYou) {
    return (
      <div
        className="min-h-screen bg-[#f8f1e3] flex items-center justify-center p-4 overflow-x-hidden"
        dir="rtl"
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-10 text-center">
          <div className="text-5xl sm:text-7xl mb-4 sm:mb-6">🙏</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#3f2a1e] mb-3 sm:mb-4">
            תודה על בחירתך!
          </h2>
          <p className="text-base sm:text-xl text-gray-700 mb-6 sm:mb-8">
            הבחירה נרשמה בהצלחה.
          </p>
          <div className="bg-[#f8f1e3] rounded-2xl p-4 sm:p-5">
            <p className="text-base sm:text-lg font-medium text-[#5c4033]">{chosenOption}</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== מצב מנהל =====
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#f8f1e3] py-6 sm:py-12 overflow-x-hidden" dir="rtl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link
            href={`/event/${eventId}/guests`}
            className="text-blue-600 hover:underline mb-6 sm:mb-8 inline-block text-sm sm:text-base"
          >
            ← חזרה לרשימת מוזמנים
          </Link>

          <div className="text-center mb-6 sm:mb-10">
            <h1 className="text-2xl sm:text-4xl font-bold mb-2">הגדרת הסעות</h1>
            <p className="text-base sm:text-xl text-gray-700">
              {eventData?.owners || 'אירוע'}
            </p>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              רשום רק את ההסעות שאתה צריך. השאר ריק לא יופיע.
            </p>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 space-y-4 sm:space-y-5">
            {options.map((opt) => (
              <div
                key={opt.id}
                className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {opt.id}
                </div>
                <input
                  type="text"
                  placeholder={`שם הסעה ${opt.id} (למשל: הסעה מתל אביב)`}
                  value={opt.name}
                  onChange={(e) => updateOption(opt.id, 'name', e.target.value)}
                  className="w-full flex-1 p-3 sm:p-4 border border-gray-300 rounded-xl sm:rounded-2xl text-base sm:text-lg min-w-0"
                />
                <input
                  type="text"
                  placeholder="שעה"
                  value={opt.time}
                  onChange={(e) => updateOption(opt.id, 'time', e.target.value)}
                  className="w-full sm:w-28 p-3 sm:p-4 border border-gray-300 rounded-xl sm:rounded-2xl text-base sm:text-lg text-center"
                />
              </div>
            ))}

            <div className="pt-4 sm:pt-6 border-t">
              <button
                onClick={saveOptions}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold"
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
    <div className="min-h-screen bg-[#f5f0e6] overflow-x-hidden" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">הסעות לאירוע</h1>
          <p className="text-lg text-gray-800">{eventData?.owners || 'האירוע'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-5">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">בחר הסעה</h2>
            <p className="text-gray-600 text-sm">לחץ על האופציה המתאימה לך</p>
          </div>

          {activeOptions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">עדיין לא הוגדרו הסעות לאירוע זה</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleChoose(option)}
                  className="w-full p-5 rounded-2xl border-2 border-gray-200 hover:border-[#d4a017] hover:bg-[#fff8e1] text-right"
                >
                  <div className="text-lg font-bold text-gray-900">{option.name}</div>
                  {option.time ? (
                    <div className="text-gray-600 text-sm mt-1">יציאה בשעה {option.time}</div>
                  ) : null}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  handleChoose({ id: 7, name: 'לא תודה אגיע עצמאית', time: '' })
                }
                className="w-full p-5 rounded-2xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-right"
              >
                <div className="text-lg font-bold text-gray-900">לא תודה אגיע עצמאית</div>
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