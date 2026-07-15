'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PricingViewPage() {
  const params = useParams();
  const eventId = params.id || "1";

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline mb-8 inline-block">← חזרה לרשימת המוזמנים</Link>

        <h1 className="text-4xl font-bold mb-10">צפיה בהצעות מחיר</h1>

        <div className="bg-white rounded-3xl shadow p-12 text-center">
          <p className="text-2xl text-gray-500">עדיין אין הצעות מחיר</p>
          <p className="text-gray-400 mt-4">בהמשך נוסיף כאן את הטבלה</p>
        </div>
      </div>
    </div>
  );
}