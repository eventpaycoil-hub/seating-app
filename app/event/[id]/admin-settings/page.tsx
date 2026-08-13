'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
}

const allActions: QuickAction[] = [
  { id: 'home', label: 'עמוד הבית', icon: '🏠' },
  { id: 'fix-phones', label: 'תיקון מספרים', icon: '📞' },
  { id: 'video', label: 'וידאו האירוע', icon: '🎥' },
  { id: 'photo', label: 'תמונות האירוע', icon: '🖼' },
  { id: 'groups', label: 'קבוצות מוזמנים', icon: '👥' },
  { id: 'guests-arrived', label: 'אורחים שהגיעו', icon: '✅' },
  { id: 'gifts', label: 'מתנות שקיבלנו', icon: '🎁' },
  { id: 'add-guests', label: 'הוספת מוזמנים', icon: '➕' },
  { id: 'seating', label: 'הושבת מוזמנים', icon: '🪑' },
  { id: 'fast-seating', label: 'הושבה מהירה', icon: '⚡' },
  { id: 'checkin', label: 'סריקת כניסה', icon: '📷' },
  { id: 'duplicate-phones', label: 'מספרים כפולים', icon: '🔁' },
  { id: 'seating-sketch', label: 'סקיצה אולם', icon: '🪑' },
  { id: 'seating-view', label: 'תצוגת אולם', icon: '🗺️' },
  { id: 'transport', label: 'הסעות', icon: '🚌' },
    { id: 'sms', label: 'SMS', icon: '📩' },
];
const DEFAULT_CLIENT_ACTIONS = [
  'home',
  'fix-phones',
  'photo',
  'groups',
  'guests-arrived',
  'gifts',
  'add-guests',
  'duplicate-phones',
  'transport',
];
interface SeatingPermissions {
  addTables: boolean;
  deleteTable: boolean;
  rotateTable: boolean;
  moveTables: boolean;
  specialItems: boolean;
  resetSketch: boolean;
  editTableInfo: boolean;
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

interface GlobalGuestHit {
  eventId: string;
  eventTitle: string;
  id: any;
  name: string;
  phone: string;
  confirmed: string;
  notes: string;
  quantity: string;
  transportation: string;
}

export default function AdminSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id || '1';

  const [visibleActions, setVisibleActions] = useState<string[]>([]);
  const [seatingPerms, setSeatingPerms] = useState<SeatingPermissions>(defaultSeatingPermissions);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalHits, setGlobalHits] = useState<GlobalGuestHit[]>([]);

  useEffect(() => {
    const savedActions = localStorage.getItem(`visibleActions_${eventId}`);
        if (savedActions) {
      setVisibleActions(JSON.parse(savedActions));
    } else {
      setVisibleActions([...DEFAULT_CLIENT_ACTIONS]);
      localStorage.setItem(
        `visibleActions_${eventId}`,
        JSON.stringify(DEFAULT_CLIENT_ACTIONS)
      );
    }

    const savedSeating = localStorage.getItem(`permissions_seating_${eventId}`);
    if (savedSeating) {
      setSeatingPerms({ ...defaultSeatingPermissions, ...JSON.parse(savedSeating) });
    }
  }, [eventId]);

    useEffect(() => {
    const term = globalSearch.trim().toLowerCase();
    if (term.length < 2) {
      setGlobalHits([]);
      return;
    }

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const eventNameById = new Map<string, string>();
    (events || []).forEach((e: any) => {
      const id = String(e.id);
      eventNameById.set(id, e.owners || e.title || `אירוע #${id}`);
    });

    const hits: GlobalGuestHit[] = [];
    const digitsTerm = term.replace(/\D/g, '');

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('guests_event_')) continue;

      const eid = key.replace('guests_event_', '');
      let guests: any[] = [];
      try {
        guests = JSON.parse(localStorage.getItem(key) || '[]');
      } catch {
        continue;
      }

      (guests || []).forEach((g: any) => {
        const name = String(g.name || '');
        const phone = String(g.phone || '');
        if (!name && !phone) return;

        const nameMatch = name.toLowerCase().includes(term);
        const phoneMatch =
          digitsTerm.length >= 2 &&
          phone.replace(/\D/g, '').includes(digitsTerm);

        if (!nameMatch && !phoneMatch) return;

        hits.push({
          eventId: eid,
          eventTitle: eventNameById.get(eid) || `אירוע #${eid}`,
          id: g.id,
          name,
          phone,
          confirmed: String(g.confirmed || ''),
          notes: String(g.notes || ''),
          quantity: String(g.quantity || g.confirmedCount || ''),
          transportation: String(g.transportation || ''),
        });
      });
    }

    hits.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    setGlobalHits(hits.slice(0, 50));
  }, [globalSearch]);
  const toggleAction = (id: string) => {
    const newVisible = visibleActions.includes(id)
      ? visibleActions.filter((a) => a !== id)
      : [...visibleActions, id];
    setVisibleActions(newVisible);
    localStorage.setItem(`visibleActions_${eventId}`, JSON.stringify(newVisible));
  };

  const enableAllActions = () => {
    const allIds = allActions.map((a) => a.id);
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
    localStorage.setItem(
      `permissions_seating_${eventId}`,
      JSON.stringify(defaultSeatingPermissions)
    );
  };

    const enterClientMode = () => {
    localStorage.setItem('userRole', 'client');
    localStorage.setItem('clientMode', 'true');
    localStorage.setItem('canReturnToAdmin', 'true');
    router.push(`/event/${eventId}/guests`);
  };

  const exitClientMode = () => {
    localStorage.setItem('userRole', 'admin');
    localStorage.removeItem('clientMode');
    localStorage.removeItem('canReturnToAdmin');
    alert('חזרת למצב מנהל');
  };

  const statusLabel = (g: GlobalGuestHit) => {
    const c = g.confirmed;
    if (c === 'לא מגיע') return '❌ לא מגיע';
    if (!c || c === 'לא ידוע' || c === 'ממתין') return '⏳ ממתין';
    if (!isNaN(Number(c)) && Number(c) >= 1) return `✅ ${c}`;
    return c || '⏳ ממתין';
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">הגדרות מנהל</h1>
            <p className="text-gray-500 mt-2">שליטה מלאה על מה שהלקוח רואה ויכול לעשות</p>
          </div>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline">
            ← חזרה לדף המוזמנים
          </Link>
        </div>

        {/* ===== חיפוש גלובלי בכל האתר ===== */}
        <div className="bg-white rounded-3xl shadow p-8 mb-8 border-2 border-indigo-100">
          <h2 className="text-2xl font-semibold mb-2">🔍 חיפוש מוזמנים בכל האתר</h2>
          <p className="text-gray-500 text-sm mb-5">
            חיפוש לפי שם או טלפון בכל האירועים (למנהל בלבד)
          </p>
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="הקלד שם או טלפון (לפחות 2 תווים)..."
            className="w-full border border-gray-300 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-indigo-500"
          />

          {globalSearch.trim().length >= 2 && (
            <div className="mt-5">
              <div className="text-sm text-gray-500 mb-3">
                {globalHits.length === 0
                  ? 'לא נמצאו תוצאות'
                  : `נמצאו ${globalHits.length} תוצאות${globalHits.length === 50 ? ' (מציג עד 50)' : ''}`}
              </div>

              {globalHits.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-indigo-50">
                      <tr>
                        <th className="text-right py-3 px-4">שם</th>
                        <th className="text-right py-3 px-4">טלפון</th>
                        <th className="text-right py-3 px-4">סטטוס</th>
                        <th className="text-right py-3 px-4">אירוע</th>
                        <th className="text-right py-3 px-4">הסעה</th>
                        <th className="text-right py-3 px-4">הערות</th>
                        <th className="text-center py-3 px-4">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalHits.map((g, idx) => (
                        <tr key={`${g.eventId}-${g.id}-${idx}`} className="border-t hover:bg-indigo-50/50">
                          <td className="py-3 px-4 font-medium">{g.name}</td>
                          <td className="py-3 px-4 font-mono">{g.phone}</td>
                          <td className="py-3 px-4">{statusLabel(g)}</td>
                          <td className="py-3 px-4 text-indigo-700 font-medium">{g.eventTitle}</td>
                          <td className="py-3 px-4 text-gray-600">{g.transportation || '—'}</td>
                          <td className="py-3 px-4 text-gray-600 max-w-[180px] truncate">
                            {g.notes || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2 justify-center flex-wrap">
                              <Link
                                href={`/event/${g.eventId}/guests`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium"
                              >
                                לאירוע
                              </Link>
                              <Link
                                href={`/event/${g.eventId}/guests/${g.id}/edit`}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium"
                              >
                                ערוך
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

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

        <div className="bg-white rounded-3xl shadow p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">כרטיסים בדף הראשי של הלקוח</h2>
            <div className="flex gap-3">
              <button
                onClick={enableAllActions}
                className="px-5 py-2 bg-emerald-600 text-white rounded-2xl text-sm font-medium hover:bg-emerald-700"
              >
                הפעל הכל
              </button>
              <button
                onClick={disableAllActions}
                className="px-5 py-2 bg-red-600 text-white rounded-2xl text-sm font-medium hover:bg-red-700"
              >
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
                  <div
                    className={`w-14 h-8 rounded-full flex items-center transition-all ${
                      isVisible ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transition-all ${
                        isVisible ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-semibold">הרשאות סקיצת אולם</h2>
              <p className="text-gray-500 text-sm mt-1">מה הלקוח יכול לעשות בתוך דף הסקיצה</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={enableAllSeating}
                className="px-5 py-2 bg-emerald-600 text-white rounded-2xl text-sm font-medium hover:bg-emerald-700"
              >
                הפעל הכל
              </button>
              <button
                onClick={disableAllSeating}
                className="px-5 py-2 bg-red-600 text-white rounded-2xl text-sm font-medium hover:bg-red-700"
              >
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
                  <div
                    className={`w-14 h-8 rounded-full flex items-center transition-all ${
                      isOn ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transition-all ${
                        isOn ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            💡 אחרי שינוי הרשאות – היכנס לדף הסקיצה במצב לקוח כדי לבדוק. השינויים נשמרים
            אוטומטית.
          </div>
        </div>
      </div>
    </div>
  );
}