'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function GuestsArrivedPage() {
  const params = useParams();
  const eventId = params.id || "1";

  const [arrivedGuests, setArrivedGuests] = useState([]);

  useEffect(() => {
    // כאן בהמשך נטען מה-localStorage או API
    const saved = JSON.parse(localStorage.getItem('arrivalGuests') || '[]');
    const arrived = saved.filter(g => g.arrivedCount && g.arrivedCount > 0);
    setArrivedGuests(arrived);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* כפתור חזרה */}
        <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline mb-8 inline-block text-xl">
          ← חזרה לרשימת המוזמנים
        </Link>

        <h1 className="text-4xl font-bold mb-10">אורחים שהגיעו לאירוע</h1>

        {arrivedGuests.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center">
            <p className="text-2xl text-gray-500">עדיין אין אורחים שהגיעו</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-8 py-5 text-right">שם</th>
                  <th className="px-8 py-5 text-right">טלפון</th>
                  <th className="px-8 py-5 text-center">כמות שהגיעה</th>
                  <th className="px-8 py-5 text-center">שולחן</th>
                </tr>
              </thead>
              <tbody>
                {arrivedGuests.map(guest => (
                  <tr key={guest.id} className="border-b hover:bg-gray-50">
                    <td className="px-8 py-5 font-medium">{guest.name}</td>
                    <td className="px-8 py-5 text-gray-600 font-mono">{guest.phone}</td>
                    <td className="px-8 py-5 text-center font-bold text-green-600">{guest.arrivedCount}</td>
                    <td className="px-8 py-5 text-center text-gray-600">{guest.table || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}