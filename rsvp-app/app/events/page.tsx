// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('יולי');

  const months = ['יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('myEvents') || '[]');
    setEvents(saved);
  }, []);

  const getMonthName = (event) => {
    let monthNum = null;
    if (event.fullDate && event.fullDate.includes('-')) {
      monthNum = parseInt(event.fullDate.split('-')[1], 10);
    } else if (event.date && event.date.includes('/')) {
      const parts = event.date.split('/');
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
    if (event.date && event.date.includes('/')) {
      const parts = event.date.split('/');
      if (parts.length >= 2) return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
      return event.date;
    }
    if (event.fullDate && event.fullDate.includes('-')) {
      const [y, m, d] = event.fullDate.split('-');
      return `${d}/${m}`;
    }
    return '';
  };

  const hasSeating = (event) =>
    event.seatingArrangement === 'כן' ||
    event.seatingArrangement === true ||
    event.showSeatingLink === 'כן';

  const isNufar = (event) =>
    event.nufarEvent === 'כן' || event.nufarEvent === true;

  const filteredEvents = events
    .filter((event) => getMonthName(event) === selectedMonth)
    .sort((a, b) => {
      const da = formatShortDate(a);
      const db = formatShortDate(b);
      const dayA = parseInt(da.split('/')[0] || '0', 10);
      const dayB = parseInt(db.split('/')[0] || '0', 10);
      return dayA - dayB;
    });

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">רשימת האירועים</h1>
          <Link href="/create-event">
            <button className="bg-green-600 text-white px-8 py-4 rounded-3xl font-bold flex items-center gap-3">
              🆕 פתח אירוע חדש
            </button>
          </Link>
        </div>

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
            <p className="text-gray-400 text-center py-10">אין אירועים בחודש זה</p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 leading-relaxed">
              {filteredEvents.map((event) => {
                const seating = hasSeating(event);
                const nufar = isNufar(event);
                const dateStr = formatShortDate(event);
                const colorClass = seating
                  ? 'text-red-600 hover:text-red-800'
                  : 'text-blue-600 hover:text-blue-800';

                return (
                  <span key={event.id} className="inline-flex items-center gap-1.5">
                    <span className="text-amber-500 text-lg leading-none">★</span>
                    <Link
                      href={`/event/${event.id}/guests`}
                      className={`${colorClass} font-bold underline underline-offset-2 decoration-1 text-[15px]`}
                    >
                      {event.owners || 'ללא שם'}
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
            <span className="text-blue-600 font-medium">כחול</span> = בלי הושבה
          </span>
          <span>(נופר) = אירוע של נופר</span>
        </div>
      </div>
    </div>
  );
}