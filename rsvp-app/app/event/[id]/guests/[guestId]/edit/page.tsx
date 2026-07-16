// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditGuestPage() {
  const params = useParams<{ id: string; guestId: string }>();
  const router = useRouter();
  const eventId = params.id;
  const guestId = parseInt(params.guestId);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    group: '',
    quantity: '',
    notes: '',
    confirmed: '',
    transport: '',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');
    const guest = saved.find((g: any) => g.id === guestId);

    if (guest) {
      setFormData({
        name: guest.name || '',
        phone: guest.phone || '',
        group: guest.group || '',
        quantity: guest.quantity || '',
        notes: guest.notes || '',
        confirmed: guest.confirmed || '',
        transport: guest.transport || '',
      });
    }
    setLoading(false);
  }, [eventId, guestId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');
    const updated = saved.map((g: any) =>
      g.id === guestId ? { ...g, ...formData } : g
    );

    localStorage.setItem(`guests_event_${eventId}`, JSON.stringify(updated));
    alert('✅ הפרטים נשמרו בהצלחה');
    router.push(`/event/${eventId}/guests`);
  };

  if (loading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">עריכת מוזמן</h1>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline">
            ← חזרה לרשימת מוזמנים
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">שם מלא</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-4 border border-gray-300 rounded-2xl text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">טלפון</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-4 border border-gray-300 rounded-2xl text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">קבוצה</label>
            <input
              type="text"
              name="group"
              value={formData.group}
              onChange={handleChange}
              className="w-full p-4 border border-gray-300 rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">כמות מוזמנים</label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full p-4 border border-gray-300 rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">סטטוס אישור</label>
            <input
              type="text"
              name="confirmed"
              value={formData.confirmed}
              onChange={handleChange}
              className="w-full p-4 border border-gray-300 rounded-2xl"
              placeholder="אישר / לא אישר / ממתין"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">הסעה</label>
            <input
              type="text"
              name="transport"
              value={formData.transport}
              onChange={handleChange}
              className="w-full p-4 border border-gray-300 rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">הערות</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full p-4 border border-gray-300 rounded-2xl"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-xl font-bold"
            >
              שמור שינויים
            </button>

            <Link
              href={`/event/${eventId}/guests`}
              className="flex-1 text-center bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 rounded-2xl text-xl font-bold"
            >
              ביטול
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}