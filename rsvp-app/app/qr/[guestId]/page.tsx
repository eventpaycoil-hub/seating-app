'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QRPage() {
  const params = useParams();
  const guestId = params.guestId;
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [guest, setGuest] = useState(null);

  useEffect(() => {
    // טעינת המוזמן לפי ID
    const allGuests = JSON.parse(localStorage.getItem(`guests_event_1`) || '[]'); // שנה ל-eventId אם צריך
    const foundGuest = allGuests.find(g => g.id.toString() === guestId);
    if (foundGuest) setGuest(foundGuest);

    // יצירת QR עם ID אמיתי
    const qrData = `Event:${'1'}|Guest:${guestId}|Name:${foundGuest?.name || 'Unknown'}`;

    QRCode.toDataURL(qrData, { 
      width: 420, 
      margin: 1, 
      color: { dark: '#111111', light: '#ffffff' } 
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
  }, [guestId]);

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-8" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-8">ברקוד כניסה לאירוע</h1>
        
        {guest && (
          <div className="mb-8">
            <div className="text-xl font-semibold">{guest.name}</div>
            <div className="text-gray-600 mt-1">מוזמן מס' {guest.id}</div>
          </div>
        )}

        {qrCodeUrl ? (
          <div className="flex justify-center mb-8">
            <img src={qrCodeUrl} alt="QR Code" className="border-8 border-white shadow-lg rounded-2xl" />
          </div>
        ) : (
          <div className="text-gray-500 py-12">טוען QR Code...</div>
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