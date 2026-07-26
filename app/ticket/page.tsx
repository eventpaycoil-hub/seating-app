'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

function TicketContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '';
  const ref = searchParams.get('ref') || searchParams.get('code') || '';

  const [guest, setGuest] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId || !ref) {
      setError('קישור לא תקין');
      return;
    }

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const ev = events.find((e: any) => e.id?.toString() === eventId.toString());
    if (ev) setEvent(ev);

    const guests = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');
    const found = guests.find(
      (g: any) =>
        g.inviteCode === ref ||
        g.id?.toString() === ref.toString()
    );

    if (!found) {
      setError('לא נמצא מוזמן');
      return;
    }
    setGuest(found);

    // חיפוש מספר שולחן
    let seating: any[] = [];
    try {
      const specific = localStorage.getItem(`seatingTables_${eventId}`);
      const general = localStorage.getItem('seatingTables');
      seating = JSON.parse(specific || general || '[]');
    } catch {}

    const name = String(found.name || '').trim();
    for (const t of seating) {
      if (Array.isArray(t.assignedGuests)) {
        const hit = t.assignedGuests.some(
          (n: string) => String(n).trim() === name
        );
        if (hit) {
          setTableNumber(t.tableNumber ?? null);
          break;
        }
      }
    }
  }, [eventId, ref]);

  // מה שנכנס ל-QR (הטאבלט יקרא את זה)
  const qrPayload = JSON.stringify({
    t: 'eventpay',
    eventId,
    ref,
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1e3]" dir="rtl">
        <div className="text-2xl text-red-600 font-bold">{error}</div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1e3]" dir="rtl">
        <div className="text-xl text-gray-500">טוען כרטיס...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f1e3] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="text-sm text-gray-500 mb-2">כרטיס כניסה</div>
        <h1 className="text-2xl font-bold text-[#3f2a1e] mb-1">
          {event?.owners || 'האירוע'}
        </h1>
        <p className="text-gray-600 mb-6">
          {event?.hallName ? `${event.hallName}` : ''}
          {event?.eventDate || event?.fullDate ? ` · ${event.eventDate || event.fullDate}` : ''}
        </p>

        <div className="text-3xl font-black text-[#3f2a1e] mb-6">
          {guest.name}
        </div>

        {tableNumber != null && (
          <div className="mb-6 py-4 px-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
            <div className="text-sm text-emerald-700">מספר שולחן</div>
            <div className="text-5xl font-black text-emerald-800">{tableNumber}</div>
          </div>
        )}

        <div className="flex justify-center mb-4 bg-white p-4 rounded-2xl border">
          <QRCodeSVG value={qrPayload} size={200} level="M" includeMargin />
        </div>

        <p className="text-sm text-gray-500">
          הציגו את הברקוד בכניסה לאולם
        </p>
      </div>
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <TicketContent />
    </Suspense>
  );
}