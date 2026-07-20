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

interface SeatingPermissions {
  addTables: boolean;
  deleteTable: boolean;
  rotateTable: boolean;
  moveTables: boolean;
  specialItems: boolean;   // DJ + רחבה
  resetSketch: boolean;
  editTableInfo: boolean;  // מספר/שם שולחן
}

const defaultSeatingPermissions: SeatingPermissions = {
  addTables: false,
  deleteTable: false,
  rotateTable: false,
  moveTables: false,
  specialItems: false,
  resetSketch: false,
  editTableInfo: false,
};

const seatingLabels: { key: keyof SeatingPermissions; label: string; icon: string }[] = [
  { key: 'addTables', label: 'הוספת שולחנות', icon: '➕' },
  { key: 'deleteTable', label: 'מחיקת שולחן (X)', icon: '🗑️' },
  { key: 'rotateTable', label: 'סיבוב שולחן', icon: '🔄' },
  { key: 'moveTables', label: 'גרירת / הזזת שולחנות', icon: '↔️' },
  { key: 'specialItems', label: 'DJ + רחבת ריקודים', icon: '🎧' },
  { key: 'resetSketch', label: 'אפס סקיצה', icon: '♻️' },
  { key: 'editTableInfo', label: 'עריכת מספר/שם שולחן', icon: '✏️' },
];

export default function AdminSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id || '1';

  const [visibleActions, setVisibleActions] = useState<string[]>([]);
  const [seatingPerms, setSeatingPerms] = useState<SeatingPermissions>(defaultSeatingPermissions);

  useEffect(() => {
    // כרטיסים בדף הראשי
    const savedActions = localStorage.getItem(`visibleActions_${eventId}`);
    if (savedActions) {
      setVisibleActions(JSON.parse(savedActions));
    } else {
      setVisibleActions(allActions.map(a => a.id));
    }

    // הרשאות סקיצה
    const savedSeating = localStorage.getItem(`permissions_seating_${eventId}`);
    if (savedSeating) {
      setSeatingPerms({ ...defaultSeatingPermissions, ...JSON.parse(savedSeating) });
    }
  }, [eventId]);

  const toggleAction = (id: string) => {
    const newVisible = visibleActions.includes(id)
      ? visibleActions.filter(a => a !== id)
      : [...visibleActions, id];
    setVisibleActions(newVisible);
    localStorage.setItem(`visibleActions_${eventId}`, JSON.stringify(newVisible));
  };

  const enableAllActions = () => {
    const allIds = allActions.map(a => a.id);
    setVisibleActions(allIds);
    localStorage.setItem(`visibleActions_${eventId}`, JSON.stringify(allIds));
  };

  const disableAllActions = () => {
    setVisibleActions([]);
    localStorage.setItem(`visibleActions_${eventId}`, JSON.stringify([]));
  };

  const toggleSeatingPerm = (key: keyof SeatingPermissions) => {
    const updated = { ...seatingPerms, [key]: !seatingPerms[key] };
    setSeatingPerms(updated);
    localStorage.setItem(`permissions_seating_${eventId}`, JSON.stringify(updated));
  };

  const enableAllSeating = () => {
    const allOn: SeatingPermissions = {
      addTables: true,
      deleteTable: true,
      rotateTable: true,
      moveTables: true,
      specialItems: true,
      resetSketch: true,
      editTableInfo: true,
    };
    setSeatingPerms(allOn);
    localStorage.setItem(`permissions_seating_${eventId}`, JSON.stringify(allOn));
  };

  const disableAllSeating = () => {
    setSeatingPerms(defaultSeatingPermissions);
    localStorage.setItem(`permissions_seating_${eventId}`, JSON.stringify(defaultSeatingPermissions));
  };

  const enterClientMode = () => {
    localStorage.setItem('userRole', 'client');
    localStorage.setItem('clientMode', 'true');
    router.push(`/event/${eventId}/guests`);
  };

  const exitClientMode = () => {
    localStorage.setItem('userRole', 'admin');
    localStorage.removeItem('clientMode');
    alert('חזרת למצב מנהל');
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* כותרת */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">הגדרות מנהל</h1>
            <p className="text-gray-500 mt-2">שליטה מלאה על מה שהלקוח רואה ויכול לעשות</p>
          </div>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline">
            ← חזרה לדף המוזמנים
          </Link>
        </div>

        {/* כפתורי תצוגה */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <button
            onClick={enterClientMode}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-3xl text-xl font-bold shadow-lg transition-all"
          >
            👁️ כניסה לתצוגת לקוח
          </button>
          <button
            onClick={exitClientMode}
            className="bg-slate-700 hover:bg-slate-800 text-white py-5 rounded-3xl text-xl font-bold shadow-lg transition-all"
          >
            🔑 חזרה למצב מנהל
          </button>
        </div>

        {/* ===== סעיף 1: כרטיסים בדף הראשי ===== */}
        <div className="bg-white rounded-3xl shadow p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">כרטיסים בדף הראשי של הלקוח</h2>
            <div className="flex gap-3">
              <button onClick={enableAllActions} className="px-5 py-2 bg-emerald-600 text-white rounded-2xl text-sm font-medium hover:bg-emerald-700">
                הפעל הכל
              </button>
              <button onClick={disableAllActions} className="px-5 py-2 bg-red-600 text-white rounded-2xl text-sm font-medium hover:bg-red-700">
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
                    <div className="text-3xl">{action.icon}</div>
                    <div className="font-medium">{action.label}</div>
                  </div>
                  <div className={`w-14 h-8 rounded-full flex items-center transition-all ${isVisible ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${isVisible ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== סעיף 2: הרשאות סקיצת אולם ===== */}
        <div className="bg-white rounded-3xl shadow p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-semibold">הרשאות סקיצת אולם</h2>
              <p className="text-gray-500 text-sm mt-1">מה הלקוח יכול לעשות בתוך דף הסקיצה</p>
            </div>
            <div className="flex gap-3">
              <button onClick={enableAllSeating} className="px-5 py-2 bg-emerald-600 text-white rounded-2xl text-sm font-medium hover:bg-emerald-700">
                הפעל הכל
              </button>
              <button onClick={disableAllSeating} className="px-5 py-2 bg-red-600 text-white rounded-2xl text-sm font-medium hover:bg-red-700">
                כבה הכל
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seatingLabels.map((item) => {
              const isOn = seatingPerms[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleSeatingPerm(item.key)}
                  className={`flex items-center justify-between p-5 border rounded-3xl cursor-pointer transition-all ${
                    isOn
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{item.icon}</div>
                    <div className="font-medium">{item.label}</div>
                  </div>
                  <div className={`w-14 h-8 rounded-full flex items-center transition-all ${isOn ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${isOn ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            💡 אחרי שינוי הרשאות – היכנס לדף הסקיצה במצב לקוח כדי לבדוק. השינויים נשמרים אוטומטית.
          </div>
        </div>
      </div>
    </div>
  );
}