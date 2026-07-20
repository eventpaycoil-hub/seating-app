// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getGuests, saveGuests, normalizeGuest } from '../../../lib/guests';

function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 && cleaned.startsWith('05');
}

function normalizePhone(raw: string): string {
  if (!raw) return '';
  let p = raw.toString().trim().replace(/[^\d+]/g, '');

  if (p.startsWith('+') && !p.startsWith('+972')) {
    const digits = p.slice(1).replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 15) return '+' + digits;
  }

  if (p.startsWith('+972')) p = p.slice(4);
  else if (p.startsWith('972')) p = p.slice(3);

  p = p.replace(/\D/g, '');
  if (p.length === 9 && p.startsWith('5')) p = '0' + p;
  return p;
}

export default function FixPhonesPage() {
  const params = useParams();
  const rawId = params.id;
  const eventId = String(Array.isArray(rawId) ? rawId[0] : rawId || '1');

  const [guests, setGuests] = useState<any[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const load = () => {
    const all = getGuests(eventId);
    setGuests(all.filter((g: any) => g.name && g.name.trim() !== ''));
  };

  useEffect(() => {
    load();
  }, [eventId]);

  // מספר לא תקין = ריק / לא 10 ספרות שמתחילות ב-05 / לא בינלאומי תקין
  const isInvalid = (phone: string) => {
    if (!phone || !phone.trim()) return true;
    if (phone.trim().startsWith('+')) {
      const digits = phone.trim().slice(1).replace(/\D/g, '');
      return digits.length < 8 || digits.length > 15;
    }
    return !isValidPhone(phone);
  };

  const invalidGuests = guests.filter((g: any) => isInvalid(g.phone || ''));

  const handleUpdate = (guestId: any) => {
    const key = String(guestId);
    const raw = (inputs[key] || '').trim();
    if (!raw) {
      alert('הזן מספר טלפון');
      return;
    }

    const normalized = normalizePhone(raw);

    // רק 10 ספרות ישראליות (05...) מאושרות כאן
    if (!isValidPhone(normalized)) {
      alert('❌ המספר חייב להיות בדיוק 10 ספרות ולהתחיל ב-05');
      return;
    }

    const updated = guests.map((g: any) =>
      String(g.id) === key ? normalizeGuest({ ...g, phone: normalized }) : g
    );

    saveGuests(eventId, updated);
    setGuests(updated);
    setInputs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-6" dir="rtl">
      <div className="max-w-xl mx-auto">
        <Link
          href={`/event/${eventId}/guests`}
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← חזרה לרשימת מוזמנים
        </Link>

        <h1 className="text-3xl font-bold mb-8">תיקון מספרי טלפון</h1>

        {invalidGuests.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-700">כל המספרים תקינים!</h2>
          </div>
        ) : (
          <div className="space-y-6">
            {invalidGuests.map((guest: any) => {
              const key = String(guest.id);
              const hasPhone = guest.phone && guest.phone.trim() !== '';

              return (
                <div
                  key={key}
                  className="bg-white rounded-3xl shadow border border-gray-100 p-6"
                >
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500 font-medium">שם:</span>
                      <span className="font-bold text-gray-900">{guest.name}</span>
                    </div>

                    <div className="flex justify-between gap-4 items-start">
                      <span className="text-gray-500 font-medium">מספר לא תקין:</span>
                      <span className="text-red-600 font-semibold text-left" dir="ltr">
                        {hasPhone ? guest.phone : 'אין מספר'}
                      </span>
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    הזן מספר תקין:
                  </label>
                  <input
                    type="tel"
                    placeholder="הכנס מספר תקין"
                    value={inputs[key] || ''}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 mb-4 text-lg"
                    dir="ltr"
                  />

                  <button
                    onClick={() => handleUpdate(guest.id)}
                    className="w-full bg-[#3d5a80] hover:bg-[#2c4460] text-white py-3.5 rounded-2xl font-bold text-lg transition"
                  >
                    עדכן
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}