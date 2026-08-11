// @ts-nocheck
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Guest {
  id: string | number;
  name: string;
  phone: string;
  [key: string]: any;
}

function cleanPhone(phone: string): string {
  if (!phone) return '';
  return phone.toString().replace(/\D/g, '');
}

export default function DuplicatePhonesPage() {
  const params = useParams();
  const rawId = params.id;
  const eventId = String(Array.isArray(rawId) ? rawId[0] : rawId || '1');

  const [guests, setGuests] = useState<Guest[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const load = () => {
    const key = `guests_event_${eventId}`;
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    setGuests(Array.isArray(saved) ? saved : []);
  };

  useEffect(() => {
    load();
  }, [eventId]);

  // קיבוץ לפי מספר מנורמל – רק כפולים
  const duplicates = useMemo(() => {
    const map: Record<string, Guest[]> = {};
    guests.forEach((g) => {
      const p = cleanPhone(g.phone || '');
      if (!p) return;
      if (!map[p]) map[p] = [];
      map[p].push(g);
    });

    const dups: Record<string, Guest[]> = {};
    Object.entries(map).forEach(([phone, list]) => {
      if (list.length > 1) dups[phone] = list;
    });
    return dups;
  }, [guests]);

  const duplicateEntries = Object.entries(duplicates);

  const handleUpdate = (guestId: string | number) => {
    const key = String(guestId);
    const raw = (inputs[key] ?? '').trim();
    if (!raw) {
      alert('הזן מספר טלפון');
      return;
    }

    const updated = guests.map((g) =>
      String(g.id) === key ? { ...g, phone: raw } : g
    );

    localStorage.setItem(`guests_event_${eventId}`, JSON.stringify(updated));
    setGuests(updated);
    setInputs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">איתור מספרים כפולים</h1>
            <p className="text-gray-600 mt-1">
              מספרי טלפון שמופיעים אצל יותר ממוזמן אחד באירוע זה
            </p>
          </div>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline">
            ← חזרה לרשימת מוזמנים
          </Link>
        </div>

        {duplicateEntries.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-14 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-700">אין מספרים כפולים באירוע זה!</h2>
          </div>
        ) : (
          <div className="space-y-8">
            {duplicateEntries.map(([phone, guestList]) => (
              <div key={phone} className="bg-white rounded-3xl shadow p-6">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="text-2xl font-bold text-red-600 bg-red-50 px-5 py-2 rounded-2xl font-mono" dir="ltr">
                    {phone}
                  </div>
                  <span className="text-red-600 font-medium">
                    מופיע אצל {guestList.length} מוזמנים
                  </span>
                </div>

                <div className="space-y-4">
                  {guestList.map((guest) => {
                    const key = String(guest.id);
                    return (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50 rounded-2xl p-4"
                      >
                        <div className="font-semibold text-lg min-w-[140px]">{guest.name}</div>
                        <input
                          type="tel"
                          placeholder="מספר מתוקן"
                          value={inputs[key] !== undefined ? inputs[key] : guest.phone || ''}
                          onChange={(e) =>
                            setInputs((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="flex-1 border border-gray-300 rounded-2xl px-4 py-3 font-mono"
                          dir="ltr"
                        />
                        <button
                          onClick={() => handleUpdate(guest.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-medium whitespace-nowrap"
                        >
                          עדכן
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}