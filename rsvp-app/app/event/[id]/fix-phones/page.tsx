'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function FixPhonesPage() {
  const params = useParams();
  const eventId = params.id || "1";

  const [guests, setGuests] = useState([]);
  const [fixedGuests, setFixedGuests] = useState([]);

  useEffect(() => {
    const guestsKey = `guests_event_${eventId}`;
    const saved = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    setGuests(saved);
  }, [eventId]);

  const fixPhone = (id: string, newPhone: string) => {
    const updated = guests.map(g => 
      g.id.toString() === id ? { ...g, phone: newPhone } : g
    );
    setGuests(updated);

    // שמירה
    const guestsKey = `guests_event_${eventId}`;
    localStorage.setItem(guestsKey, JSON.stringify(updated));
  };

  const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9+]/g, ''); // שומר רק ספרות ו+

    if (cleaned.startsWith('+972')) {
      cleaned = '0' + cleaned.slice(4); // +972 → 0
    }

    if (cleaned.length === 9 && cleaned.startsWith('5')) {
      cleaned = '0' + cleaned;
    }

    return cleaned;
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return cleaned.length === 10 && cleaned.startsWith('05');
  };

  const handleFix = (id: string, currentPhone: string) => {
    const normalized = normalizePhone(currentPhone);
    if (validatePhone(normalized)) {
      fixPhone(id, normalized);
      alert(`✅ המספר תוקן בהצלחה: ${normalized}`);
    } else {
      alert('❌ המספר לא תקין. צריך להיות 10 ספרות ולהתחיל ב-05');
    }
  };

  const invalidGuests = guests.filter(g => !validatePhone(g.phone || ''));

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline mb-8 inline-block">← חזרה לרשימת מוזמנים</Link>

        <h1 className="text-4xl font-bold mb-10">תיקון מספרי טלפון לא תקינים</h1>

        {invalidGuests.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-12 text-center">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-3xl font-bold text-green-700">כל המספרים תקינים!</h2>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-rose-50">
                <tr>
                  <th className="text-right py-6 px-8">שם</th>
                  <th className="text-right py-6 px-8">מספר נוכחי</th>
                  <th className="text-right py-6 px-8">מספר מתוקן מוצע</th>
                  <th className="py-6 px-8 text-center">פעולה</th>
                </tr>
              </thead>
              <tbody>
                {invalidGuests.map(guest => {
                  const suggested = normalizePhone(guest.phone || '');
                  return (
                    <tr key={guest.id} className="border-b hover:bg-rose-50">
                      <td className="py-6 px-8 font-medium">{guest.name}</td>
                      <td className="py-6 px-8 font-mono text-red-600">{guest.phone}</td>
                      <td className="py-6 px-8 font-mono text-green-600">{suggested}</td>
                      <td className="py-6 px-8 text-center">
                        <button 
                          onClick={() => handleFix(guest.id, guest.phone)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl font-medium"
                        >
                          אשר תיקון
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}