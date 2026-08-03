// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, ArrowRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

function normalizeGroupName(name: any): string {
  return (name || '').toString().trim();
}

export default function GroupsPage() {
  const params = useParams();
  const eventId = params.id || '1';

  const [groups, setGroups] = useState<any[]>([]);
  const [newGroupNames, setNewGroupNames] = useState(Array(5).fill(''));
  const [eventTitle, setEventTitle] = useState('');

  const persist = (list: any[]) => {
    setGroups(list);
    localStorage.setItem(`groups_event_${eventId}`, JSON.stringify(list));
  };

  useEffect(() => {
    if (!eventId) return;

    // כותרת אירוע
    try {
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const current = events.find((e: any) => String(e.id) === String(eventId));
      if (current) setEventTitle(current.owners || current.title || '');
    } catch {}

    // 1) קבוצות שמורות
    let saved: any[] = [];
    try {
      const raw = localStorage.getItem(`groups_event_${eventId}`);
      saved = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(saved)) saved = [];
    } catch {
      saved = [];
    }

    // 2) קבוצות מהמוזמנים
    let fromGuests: string[] = [];
    try {
      const guests = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');
      fromGuests = (guests || [])
        .map((g: any) => normalizeGroupName(g.group))
        .filter(Boolean);
    } catch {}

    // מיזוג לפי שם (בלי כפילויות)
    const byName = new Map<string, any>();

    saved.forEach((g: any, index: number) => {
      const name =
        typeof g === 'string'
          ? normalizeGroupName(g)
          : normalizeGroupName(g?.name || g?.title || g?.label);
      if (!name) return;
      byName.set(name, {
        id: g?.id || Date.now() + index,
        name,
        simCount: g?.simCount || index + 1,
      });
    });

    fromGuests.forEach((name) => {
      if (!byName.has(name)) {
        byName.set(name, {
          id: Date.now() + Math.floor(Math.random() * 100000),
          name,
          simCount: byName.size + 1,
        });
      }
    });

    const merged = Array.from(byName.values()).map((g, i) => ({
      ...g,
      simCount: i + 1,
    }));

    setGroups(merged);
    // שומרים את המיזוג כדי שהדף והעריכות יישארו מסונכרנים
    localStorage.setItem(`groups_event_${eventId}`, JSON.stringify(merged));
  }, [eventId]);

  const addNewGroup = () => {
    const groupName = prompt('הזן שם לקבוצה החדשה:', `קבוצה ${groups.length + 1}`);
    if (!groupName || !groupName.trim()) return;

    const name = groupName.trim();
    if (groups.some((g) => g.name === name)) {
      alert('הקבוצה כבר קיימת');
      return;
    }

    const updated = [
      ...groups,
      {
        id: Date.now(),
        name,
        simCount: groups.length + 1,
      },
    ].map((g, i) => ({ ...g, simCount: i + 1 }));

    persist(updated);
  };

  const addMultipleGroups = () => {
    const validNames = newGroupNames.map((n) => n.trim()).filter(Boolean);
    if (validNames.length === 0) {
      alert('לא הוזנו שמות');
      return;
    }

    const existing = new Set(groups.map((g) => g.name));
    const toAdd = validNames.filter((n) => !existing.has(n));

    if (toAdd.length === 0) {
      alert('כל הקבוצות כבר קיימות');
      return;
    }

    const newGroups = toAdd.map((name, index) => ({
      id: Date.now() + index,
      name,
      simCount: groups.length + index + 1,
    }));

    const updated = [...groups, ...newGroups].map((g, i) => ({ ...g, simCount: i + 1 }));
    persist(updated);
    setNewGroupNames(Array(5).fill(''));
    alert(`✅ ${newGroups.length} קבוצות נוספו בהצלחה!`);
  };

  const deleteGroup = (id: number) => {
    if (!confirm('למחוק את הקבוצה?')) return;
    const updated = groups
      .filter((g) => g.id !== id)
      .map((g, i) => ({ ...g, simCount: i + 1 }));
    persist(updated);
  };

  const updateGroupName = (id: number) => {
    const currentGroup = groups.find((g) => g.id === id);
    if (!currentGroup) return;

    const newName = prompt('שנה שם קבוצה:', currentGroup.name);
    if (!newName || !newName.trim()) return;

    const name = newName.trim();
    if (groups.some((g) => g.id !== id && g.name === name)) {
      alert('כבר קיימת קבוצה בשם הזה');
      return;
    }

    const updated = groups.map((g) => (g.id === id ? { ...g, name } : g));
    persist(updated);
  };

    return (
    <div className="min-h-screen bg-zinc-100 p-4 sm:p-6 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Link
            href={`/event/${eventId}/guests`}
            className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium"
          >
            <ArrowRight size={16} />
            חזרה לרשימת המוזמנים
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#3f2a1e]">
              קבוצות מוזמנים
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              {eventTitle ? eventTitle : `אירוע #${eventId}`}
            </p>
          </div>

          <button
            onClick={addNewGroup}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 sm:px-8 sm:py-4 rounded-2xl sm:rounded-3xl font-bold flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 shadow-lg w-full sm:w-auto text-sm sm:text-base"
          >
            <Plus size={20} className="sm:w-6 sm:h-6" /> קבוצה חדשה
          </button>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow p-4 sm:p-6 md:p-8 mb-6 sm:mb-10">
          <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">הוסף קבוצות מרובות</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {newGroupNames.map((name, index) => (
              <input
                key={index}
                type="text"
                value={name}
                onChange={(e) => {
                  const next = [...newGroupNames];
                  next[index] = e.target.value;
                  setNewGroupNames(next);
                }}
                placeholder={`קבוצה ${groups.length + index + 1}`}
                className="p-3 sm:p-4 border border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:border-blue-500 text-base"
              />
            ))}
          </div>
          <button
            onClick={addMultipleGroups}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 sm:px-10 sm:py-4 rounded-2xl sm:rounded-3xl font-bold w-full md:w-auto text-sm sm:text-base"
          >
            העלה את כל הקבוצות
          </button>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
          {groups.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-gray-500 text-base sm:text-lg">
              עדיין אין קבוצות. הוסף ידנית או העלה מוזמנים עם שיוך לקבוצה.
            </div>
          ) : (
            <>
              {/* מובייל: כרטיסים */}
              <div className="md:hidden divide-y divide-gray-100">
                {groups.map((group) => (
                  <div key={group.id} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center flex-shrink-0">
                      {group.simCount}
                    </div>
                    <div className="flex-1 min-w-0 font-semibold text-base truncate">
                      {group.name}
                    </div>
                    <button
                      onClick={() => updateGroupName(group.id)}
                      className="text-green-600 hover:bg-green-50 p-2.5 rounded-xl flex-shrink-0"
                      aria-label="ערוך"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="text-red-600 hover:bg-red-50 p-2.5 rounded-xl flex-shrink-0"
                      aria-label="מחק"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {/* טאבלט + מחשב: טבלה כמו קודם */}
              <table className="w-full hidden md:table">
                <thead className="bg-gradient-to-r from-[#3f2a1e] to-[#5c4033] text-white">
                  <tr>
                    <th className="py-5 px-6 text-right w-28"></th>
                    <th className="py-5 px-6 text-right w-28"></th>
                    <th className="py-5 px-6 text-right">שם הקבוצה</th>
                    <th className="py-5 px-6 text-center">מספר סידורי</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {groups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-5 px-6">
                        <button
                          onClick={() => deleteGroup(group.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-2xl transition-all flex items-center gap-2 text-sm font-medium"
                        >
                          <Trash2 size={18} /> מחק
                        </button>
                      </td>
                      <td className="py-5 px-6">
                        <button
                          onClick={() => updateGroupName(group.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 px-4 py-2 rounded-2xl transition-all flex items-center gap-2 text-sm font-medium"
                        >
                          <Edit3 size={18} /> ערוך
                        </button>
                      </td>
                      <td className="py-5 px-6 font-semibold text-lg">{group.name}</td>
                      <td className="py-5 px-6 text-center font-bold text-xl text-blue-600">
                        {group.simCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}