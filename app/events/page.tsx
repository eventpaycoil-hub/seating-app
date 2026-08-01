// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAllEvents } from '../../lib/events';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('הכל');
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const months = ['הכל', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await fetchAllEvents();
        console.log('fetchAllEvents result:', list);

        if (!cancelled) {
          if (list && list.length > 0) {
            setEvents(list);
            localStorage.setItem('myEvents', JSON.stringify(list));
          } else {
            const local = JSON.parse(localStorage.getItem('myEvents') || '[]');
            setEvents(local);
            if (!local.length) setErrorMsg('לא נמצאו אירועים בענן ובמקומי');
          }
        }
      } catch (e) {
        console.error('fetchAllEvents error:', e);
        if (!cancelled) {
          const local = JSON.parse(localStorage.getItem('myEvents') || '[]');
          setEvents(local);
          setErrorMsg(String(e?.message || e));
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const getMonthName = (event) => {
    let monthNum = null;
    if (event.fullDate && String(event.fullDate).includes('-')) {
      monthNum = parseInt(String(event.fullDate).split('-')[1], 10);
    } else if (event.date && String(event.date).includes('/')) {
      const parts = String(event.date).split('/');
      monthNum = parseInt(parts[1] || parts[0], 10);
    } else if (event.month) {
      return event.month;
    }
    const names = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
    ];
    return monthNum >= 1 && monthNum <= 12 ? names[monthNum - 1] : '';
  };

  const formatShortDate = (event) => {
    if (event.date && String(event.date).includes('/')) {
      const parts = String(event.date).split('/');
      if (parts.length >= 2) return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
      return event.date;
    }
    if (event.fullDate && String(event.fullDate).includes('-')) {
      const [y, m, d] = String(event.fullDate).split('-');
      return `${d}/${m}`;
    }
    return '';
  };

  const hasSeating = (event) =>
    event.seatingArrangement === 'כן' ||
    event.seatingArrangement === true ||
    event.showSeatingLink === 'כן' ||
    event.showSeatingLink === true ||
    event.hasSeating === 'כן' ||
    event.hasSeating === true;

  const isNufar = (event) =>
    event.nufarEvent === 'כן' ||
    event.nufarEvent === true ||
    event.isNufar === 'כן' ||
    event.isNufar === true ||
    event.nufar === 'כן' ||
    event.nufar === true;

  const filteredEvents = events
    .filter((event) => selectedMonth === 'הכל' || getMonthName(event) === selectedMonth)
    .sort((a, b) => {
      const da = formatShortDate(a);
      const db = formatShortDate(b);
      const dayA = parseInt(da.split('/')[0] || '0', 10);
      const dayB = parseInt(db.split('/')[0] || '0', 10);
      return dayA - dayB;
    });

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100" dir="rtl">
        <p className="text-xl text-slate-600">טוען אירועים...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">רשימת האירועים</h1>
            <p className="text-sm text-slate-500 mt-1">סה״כ בענן/מקומי: {events.length}</p>
          </div>
          <Link href="/create-event">
            <button className="bg-green-600 text-white px-8 py-4 rounded-3xl font-bold flex items-center gap-3">
              🆕 פתח אירוע חדש
            </button>
          </Link>
        </div>

        {errorMsg && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {months.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-6 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedMonth === month
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white hover:bg-gray-100 text-slate-700'
              }`}
            >
              {month}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[120px]">
          {filteredEvents.length === 0 ? (
            <p className="text-gray-400 text-center py-10">
              אין אירועים {selectedMonth === 'הכל' ? '' : `בחודש ${selectedMonth}`}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 leading-relaxed">
              {filteredEvents.map((event) => {
                const seating = hasSeating(event);
                const nufar = isNufar(event);
                const dateStr = formatShortDate(event);
                const colorClass = seating
                  ? 'text-red-600 hover:text-red-800'
                  : 'text-cyan-600 hover:text-cyan-800';

                return (
                  <span key={event.id} className="inline-flex items-center gap-1.5">
                    <span className="text-amber-500 text-lg leading-none">★</span>
                    <Link
                      href={`/event/${event.id}/guests`}
                      className={`${colorClass} font-bold underline underline-offset-2 decoration-1 text-[15px]`}
                    >
                      {event.owners || event.title || 'ללא שם'}
                      {dateStr ? ` (${dateStr})` : ''}
                      {nufar ? ' (נופר)' : ''}
                    </Link>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-slate-500 flex flex-wrap gap-4">
          <span>
            <span className="text-red-600 font-medium">אדום</span> = עם סידורי הושבה
          </span>
          <span>
            <span className="text-cyan-600 font-medium">תכלת</span> = בלי הושבה
          </span>
          <span>(נופר) = אירוע של נופר</span>
        </div>
      </div>
    </div>
  );
}