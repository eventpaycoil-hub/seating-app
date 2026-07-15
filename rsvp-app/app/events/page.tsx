// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('יולי');

  const months = ["יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('myEvents') || '[]');
    setEvents(saved);
  }, []);

  const filteredEvents = events.filter(event => {
    const monthIndex = parseInt(event.date?.split('/')[1] || '7') - 1;
    const monthName = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"][monthIndex];
    return monthName === selectedMonth;
  });

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">רשימת האירועים</h1>
          <Link href="/create-event">
            <button className="bg-green-600 text-white px-8 py-4 rounded-3xl font-bold flex items-center gap-3">
              🆕 פתח אירוע חדש
            </button>
          </Link>
        </div>

        {/* כפתורי חודשים */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-4">
          {months.map(month => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-8 py-3 rounded-2xl font-medium whitespace-nowrap transition-all ${
                selectedMonth === month 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {month}
            </button>
          ))}
        </div>

        {/* רשימת אירועים */}
        <div className="flex flex-wrap gap-6">
          {filteredEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-20 w-full">אין אירועים בחודש זה</p>
          ) : (
            filteredEvents.map(event => (
              <Link key={event.id} href={`/event/${event.id}/guests`}>
                <div className="bg-white hover:bg-gray-50 px-8 py-6 rounded-2xl shadow-sm hover:shadow transition min-w-[420px]">
                  <div className="text-3xl font-bold text-blue-700 mb-1">{event.owners || event.title}</div>
                  <div className="text-xl text-gray-600">{event.title}</div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-2xl font-medium">{event.date}</div>
                    <div className="text-sm text-gray-500">{event.type}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}