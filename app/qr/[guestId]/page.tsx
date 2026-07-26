// @ts-nocheck
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import QRCode from 'qrcode';

function QRContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  // הקישור הישן: /qr/EVENT_ID?guest=GUEST_ID
  // הקישור הנכון: /qr/GUEST_ID?eventId=EVENT_ID
  const pathId = String(params?.guestId || '');
  const guestFromQuery =
    searchParams.get('guest') ||
    searchParams.get('guestId') ||
    searchParams.get('ref') ||
    '';
  const eventFromQuery = searchParams.get('eventId') || '';

  const realGuestId = guestFromQuery || pathId;
  const realEventId = eventFromQuery || (guestFromQuery ? pathId : '');

  const nameFromUrl = searchParams.get('name') || '';
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [displayName, setDisplayName] = useState(nameFromUrl);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!realGuestId) {
      setError('חסר מזהה מוזמן בקישור');
      return;
    }

    // ניסיון להביא שם מהמכשיר (מנהל)
    if (!displayName && realEventId) {
      try {
        const list = JSON.parse(
          localStorage.getItem(`guests_event_${realEventId}`) || '[]'
        );
        const g = list.find(
          (x) =>
            String(x.id) === realGuestId ||
            String(x.inviteCode) === realGuestId ||
            String(x.id).replace(/\./g, '') ===
              realGuestId.replace(/\./g, '')
        );
        if (g?.name) setDisplayName(g.name);
      } catch {}
    }

    const qrData = JSON.stringify({
      t: 'eventpay',
      eventId: String(realEventId || ''),
      ref: String(realGuestId),
      guestId: String(realGuestId),
      name: displayName || nameFromUrl || '',
    });

    QRCode.toDataURL(qrData, {
      width: 420,
      margin: 2,
      color: { dark: '#111111', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrCodeUrl(url))
      .catch(() => setError('שגיאה ביצירת ברקוד'));
  }, [realGuestId, realEventId, nameFromUrl, displayName]);

  return (
    <div
      className="min-h-screen bg-zinc-100 flex items-center justify-center p-8"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-8">ברקוד כניסה לאירוע</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {displayName && (
          <div className="mb-6 text-xl font-semibold">{displayName}</div>
        )}

        <div className="text-xs text-gray-400 mb-4 break-all">
          מוזמן: {realGuestId}
          {realEventId ? ` | אירוע: ${realEventId}` : ''}
        </div>

        {qrCodeUrl ? (
          <div className="flex justify-center mb-8">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="border-8 border-white shadow-lg rounded-2xl"
            />
          </div>
        ) : (
          !error && (
            <div className="text-gray-500 py-12">טוען QR Code...</div>
          )
        )}

        <div className="text-sm text-gray-500 mb-6">
          הצג את הקוד לדיילת בכניסה לאולם
        </div>

        <button
          onClick={() => window.print()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-medium text-lg"
        >
          🖨 הדפס
        </button>
      </div>
    </div>
  );
}

export default function QRPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          טוען...
        </div>
      }
    >
      <QRContent />
    </Suspense>
  );
}