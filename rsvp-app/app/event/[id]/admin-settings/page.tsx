'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
}

const allActions: QuickAction[] = [
  { id: 'home', label: 'עמוד הבית', icon: '🏠' },
  { id: 'video', label: 'וידאו האירוע', icon: '🎥' },
  { id: 'photo', label: 'תמונת האירוע', icon: '🖼️' },
  { id: 'groups', label: 'קבוצות המוזמנים', icon: '👥' },
  { id: 'waze', label: 'רשומות WAZE', icon: '📍' },
  { id: 'add-guests', label: 'הוספת מוזמנים', icon: '➕' },
  { id: 'seating', label: 'הושבת מוזמנים', icon: '🪑' },
  { id: 'fast-seating', label: 'הושבה מהירה', icon: '⚡' },
  { id: 'arrived', label: 'אורחים שהגיעו', icon: '✅' },
  { id: 'add-tables', label: 'הוספת שולחנות', icon: '➕' },
  { id: 'pricing', label: 'הצעות מחיר', icon: '💰' },
  { id: 'pricing-view', label: 'צפייה בהצעות', icon: '👀' },
  { id: 'events-list', label: 'רשימת אירועים', icon: '📅' },
  { id: 'edit-event', label: 'עריכת אירוע', icon: '✏️' },
  { id: 'sms', label: 'SMS', icon: '📩' },
  { id: 'whatsapp', label: 'תבניות ווטסאפ', icon: '💬' },
  { id: 'transport', label: 'הסעות', icon: '🚌' },
  { id: 'seating-sketch', label: 'סקיצה אולם', icon: '🪑' },
  { id: 'new-event', label: 'פתח אירוע חדש', icon: '➕' },
];

export default function AdminSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id || "1";

  const [visibleActions, setVisibleActions] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`visibleActions_${eventId}`);
    if (saved) {
      setVisibleActions(JSON.parse(saved));
    } else {
      setVisibleActions(allActions.map(a => a.id));
    }
  }, [eventId]);

  const toggleAction = (id: string) => {
    let newVisible: string[];

    if (visibleActions.includes(id)) {
      newVisible = visibleActions.filter(a => a !== id);
    } else {
      newVisible = [...visibleActions, id];
    }

    setVisibleActions(newVisible);
    localStorage.setItem(`visibleActions_${eventId}`, JSON.stringify(newVisible));
  };

  const enableAll = () => {
    const allIds = allActions.map(a => a.id);
    setVisibleActions(allIds);
    localStorage.setItem(`visibleActions_${eventId}`, JSON.stringify(allIds));
  };

  const disableAll = () => {
    setVisibleActions([]);
    localStorage.setItem(`visibleActions_${eventId}`, JSON.stringify([]));
  };

  const enterClientMode = () => {
    localStorage.setItem('clientMode', 'true');
    router.push(`/event/${eventId}/guests`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">הגדרות מנהל</h1>
            <p className="text-gray-500 mt-2">בחר אילו כרטיסים יופיעו ללקוח בדף הראשי</p>
          </div>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline">
            ← חזרה לדף המוזמנים
          </Link>
        </div>

        {/* כפתור תצוגת לקוח */}
        <div className="mb-8">
          <button
            onClick={enterClientMode}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-3xl text-xl font-bold shadow-lg transition-all"
          >
            👁️ כניסה לתצוגת לקוח (לבדיקה)
          </button>
          <p className="text-center text-sm text-gray-500 mt-2">
            לחץ כאן כדי לראות איך הדף נראה ללקוח לפי ההגדרות שלך
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">כרטיסים זמינים ללקוח</h2>
            <div className="flex gap-3">
              <button onClick={enableAll} className="px-6 py-2 bg-emerald-600 text-white rounded-2xl text-sm font-medium hover:bg-emerald-700">
                הפעל הכל
              </button>
              <button onClick={disableAll} className="px-6 py-2 bg-red-600 text-white rounded-2xl text-sm font-medium hover:bg-red-700">
                כבה הכל
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allActions.map((action) => {
              const isVisible = visibleActions.includes(action.id);
              return (
                <div
                  key={action.id}
                  onClick={() => toggleAction(action.id)}
                  className={`flex items-center justify-between p-5 border rounded-3xl cursor-pointer transition-all ${
                    isVisible 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{action.icon}</div>
                    <div className="font-medium text-lg">{action.label}</div>
                  </div>

                  <div className={`w-14 h-8 rounded-full flex items-center transition-all ${isVisible ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${isVisible ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-sm text-gray-500">
            * השינויים נשמרים אוטומטית. הלקוח יראה רק את הכרטיסים שסימנת כמוצגים.
          </div>
        </div>
      </div>
    </div>
  );
}