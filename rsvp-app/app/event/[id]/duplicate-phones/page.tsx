'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Guest {
  id: string | number;
  name: string;
  phone: string;
}

export default function DuplicatePhonesPage() {
  const params = useParams();
  const eventId = params.id || "1";

  const [guests, setGuests] = useState<Guest[]>([]);
  const [duplicates, setDuplicates] = useState<Record<string, Guest[]>>({});

  useEffect(() => {
    const guestsKey = `guests_event_${eventId}`;
    const saved = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    setGuests(saved);
  }, [eventId]);

  // חישוב כפולים
  useEffect(() => {
    const phoneMap: Record<string, Guest[]> = {};

    guests.forEach(guest => {
      const phone = (guest.phone || '').trim();
      if (phone) {
        if (!phoneMap[phone]) phoneMap[phone] = [];
        phoneMap[phone].push(guest);
      }
    });

    const dups: Record<string, Guest[]> = {};
    Object.keys(phoneMap).forEach(phone => {
      if (phoneMap[phone].length > 1) {
        dups[phone] = phoneMap[phone];
      }
    });

    setDuplicates(dups);
  }, [guests]);

  const updatePhone = (guestId: string | number, newPhone: string) => {
    const updatedGuests = guests.map(g =>
      g.id.toString() === guestId.toString() ? { ...g, phone: newPhone.trim() } : g
    );

    setGuests(updatedGuests);

    const guestsKey = `guests_event_${eventId}`;
    localStorage.setItem(guestsKey, JSON.stringify(updatedGuests));
  };

  const duplicateEntries = Object.entries(duplicates);

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">איתור מספרים כפולים</h1>
            <p className="text-gray-600 mt-2">מספרי טלפון שמופיעים אצל יותר ממוזמן אחד באירוע</p>
          </div>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-lg">
            ← חזרה לרשימת מוזמנים
          </Link>
        </div>

        {duplicateEntries.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-16 text-center">
            <div className="text-7xl mb-6">✅</div>
            <h2 className="text-3xl font-bold text-green-700">אין מספרים כפולים באירוע זה!</h2>
          </div>
        ) : (
          <div className="space-y-10">
            {duplicateEntries.map(([phone, guestList]) => (
              <div key={phone} className="bg-white rounded-3xl shadow p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="text-4xl font-bold text-red-600 bg-red-50 px-8 py-4 rounded-2xl">
                    {phone}
                  </div>
                  <div className="text-xl text-red-600">
                    מופיע אצל {guestList.length} מוזמנים
                  </div>
                </div>

                <div className="space-y-6">
                  {guestList.map(guest => (
                    <div key={guest.id} className="flex items-center gap-6 bg-gray-50 rounded-2xl p-6">
                      <div className="flex-1">
                        <div className="font-semibold text-xl mb-1">{guest.name}</div>
                        <input
                          type="text"
                          defaultValue={guest.phone}
                          onBlur={(e) => updatePhone(guest.id, e.target.value)}
                          className="w-80 border border-gray-300 rounded-2xl px-5 py-3 text-lg font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        לחץ מחוץ לתיבה כדי לשמור
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}