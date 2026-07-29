// @ts-nocheck
'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { loadGuests } from '../../../../lib/guests';
import * as XLSX from 'xlsx';
type GiftRow = {
  cash: number;
  credit: number;
};

function normName(s: any) {
  return String(s || '').trim().replace(/\s+/g, ' ');
}

function loadGifts(eventId: string): Record<string, GiftRow> {
  try {
    const raw = localStorage.getItem(`gifts_event_${eventId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveGifts(eventId: string, data: Record<string, GiftRow>) {
  localStorage.setItem(`gifts_event_${eventId}`, JSON.stringify(data));
}

export default function GiftsPage() {
  const params = useParams();
  const eventId = String(params?.id || '');

  const [guests, setGuests] = useState<any[]>([]);
  const [gifts, setGifts] = useState<Record<string, GiftRow>>({});
  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
        const current = events.find((e: any) => String(e.id) === String(eventId));
        if (current && !cancelled) {
          setEventTitle(current.owners || current.title || `אירוע #${eventId}`);
        }

        const list = await loadGuests(eventId);
        if (!cancelled) {
          setGuests(Array.isArray(list) ? list : []);
          setGifts(loadGifts(eventId));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const guestKey = (g: any) => {
    if (g?.id != null) return String(g.id);
    return normName(g?.name);
  };

  const updateGift = (key: string, field: 'cash' | 'credit', value: string) => {
    const num = value === '' ? 0 : Math.max(0, Number(value) || 0);
    setGifts((prev) => {
      const next = {
        ...prev,
        [key]: {
          cash: field === 'cash' ? num : prev[key]?.cash || 0,
          credit: field === 'credit' ? num : prev[key]?.credit || 0,
        },
      };
      saveGifts(eventId, next);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (guests || []).filter((g) => {
      if (!g?.name || !String(g.name).trim()) return false;
      if (!q) return true;
      return (
        String(g.name).toLowerCase().includes(q) ||
        String(g.phone || '').includes(q)
      );
    });
  }, [guests, search]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    filtered.forEach((g) => {
      const key = (g.group && String(g.group).trim()) || 'כללי';
      if (!map[key]) map[key] = [];
      map[key].push(g);
    });
    return Object.entries(map).sort((a, b) => {
      if (a[0] === 'כללי') return 1;
      if (b[0] === 'כללי') return -1;
      return a[0].localeCompare(b[0], 'he');
    });
  }, [filtered]);
  const exportExcel = () => {
    const rows: any[] = [];

    grouped.forEach(([groupName, list]) => {
      list.forEach((g) => {
        const key = guestKey(g);
        const row = gifts[key] || { cash: 0, credit: 0 };
        const cash = Number(row.cash) || 0;
        const credit = Number(row.credit) || 0;
        rows.push({
          קבוצה: groupName,
          שם: g.name || '',
          טלפון: g.phone || '',
          סכום: cash + credit,
          מזומן: cash,
          אשראי: credit,
        });
      });
    });

    rows.push({
      קבוצה: '',
      שם: 'סה״כ',
      טלפון: '',
      סכום: totals.sum,
      מזומן: totals.cash,
      אשראי: totals.credit,
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'מתנות');
    XLSX.writeFile(wb, `מתנות-${eventTitle || eventId}.xlsx`);
  };
  const totals = useMemo(() => {
    let cash = 0;
    let credit = 0;
    filtered.forEach((g) => {
      const row = gifts[guestKey(g)];
      if (!row) return;
      cash += Number(row.cash) || 0;
      credit += Number(row.credit) || 0;
    });
    return { cash, credit, sum: cash + credit };
  }, [filtered, gifts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <div className="text-xl text-slate-600">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* כותרת */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">מתנות שקיבלנו</h1>
            <p className="text-slate-500 mt-1">{eventTitle}</p>
          </div>
          <Link
            href={`/event/${eventId}/guests`}
            className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium"
          >
            ← חזרה למוזמנים
          </Link>
        </div>

        {/* חיפוש + סיכום עליון */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          <input
            type="text"
            placeholder="חיפוש לפי שם או טלפון..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-3 border-2 border-slate-200 rounded-2xl focus:border-emerald-400 focus:outline-none bg-white"
          />
          <div className="flex gap-2 flex-wrap items-center">
  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 text-center min-w-[110px]">
    <div className="text-xs text-emerald-700">סה״כ</div>
    <div className="text-lg font-bold text-emerald-800">
      ₪{totals.sum.toLocaleString('he-IL')}
    </div>
  </div>
  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2 text-center min-w-[110px]">
    <div className="text-xs text-amber-700">מזומן</div>
    <div className="text-lg font-bold text-amber-800">
      ₪{totals.cash.toLocaleString('he-IL')}
    </div>
  </div>
  <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2 text-center min-w-[110px]">
    <div className="text-xs text-blue-700">אשראי</div>
    <div className="text-lg font-bold text-blue-800">
      ₪{totals.credit.toLocaleString('he-IL')}
    </div>
  </div>
  <button
    type="button"
    onClick={exportExcel}
    className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-2xl font-medium whitespace-nowrap"
  >
    📥 ייצוא לאקסל
  </button>
</div>
</div>
        {/* טבלה */}
        <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="px-4 py-3 text-right font-bold border-b">שם המוזמן</th>
                  <th className="px-4 py-3 text-right font-bold border-b">טלפון</th>
                  <th className="px-4 py-3 text-center font-bold border-b">סכום</th>
                  <th className="px-4 py-3 text-center font-bold border-b">מזומן</th>
                  <th className="px-4 py-3 text-center font-bold border-b">אשראי</th>
                </tr>
              </thead>
              <tbody>
                {grouped.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      אין מוזמנים להצגה
                    </td>
                  </tr>
                ) : (
                  grouped.map(([groupName, list]) => {
                    let groupCash = 0;
                    let groupCredit = 0;
                    list.forEach((g) => {
                      const row = gifts[guestKey(g)];
                      groupCash += Number(row?.cash) || 0;
                      groupCredit += Number(row?.credit) || 0;
                    });
                    const groupSum = groupCash + groupCredit;

                    return (
                      <Fragment key={groupName}>
                        <tr>
                          <td
                            colSpan={5}
                            className="bg-amber-100 border-y border-amber-200 px-4 py-2.5 font-bold text-amber-950 text-base"
                          >
                            {groupName}
                            <span className="text-amber-700 font-normal text-sm mr-3">
                              ({list.length}) · ₪{groupSum.toLocaleString('he-IL')}
                            </span>
                          </td>
                        </tr>
                        {list.map((g, idx) => {
                          const key = guestKey(g);
                          const row = gifts[key] || { cash: 0, credit: 0 };
                          const sum = (Number(row.cash) || 0) + (Number(row.credit) || 0);
                          const bg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';

                          return (
                            <tr key={key} className={`${bg} hover:bg-emerald-50/40`}>
                              <td className="px-4 py-2.5 border-b border-slate-100 font-medium text-slate-800">
                                {g.name}
                              </td>
                              <td className="px-4 py-2.5 border-b border-slate-100 text-slate-600 font-mono" dir="ltr">
                                {g.phone || '—'}
                              </td>
                              <td className="px-4 py-2.5 border-b border-slate-100 text-center font-bold text-emerald-700">
                                {sum > 0 ? `₪${sum.toLocaleString('he-IL')}` : '—'}
                              </td>
                              <td className="px-3 py-2 border-b border-slate-100 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  inputMode="numeric"
                                  value={row.cash || ''}
                                  onChange={(e) => updateGift(key, 'cash', e.target.value)}
                                  placeholder="0"
                                  className="w-24 mx-auto block text-center border border-slate-200 rounded-xl px-2 py-1.5 focus:border-amber-400 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2 border-b border-slate-100 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  inputMode="numeric"
                                  value={row.credit || ''}
                                  onChange={(e) => updateGift(key, 'credit', e.target.value)}
                                  placeholder="0"
                                  className="w-24 mx-auto block text-center border border-slate-200 rounded-xl px-2 py-1.5 focus:border-blue-400 focus:outline-none"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 text-white">
                  <td className="px-4 py-4 font-bold text-base" colSpan={2}>
                    סה״כ הכל
                  </td>
                  <td className="px-4 py-4 text-center font-black text-lg text-emerald-300">
                    ₪{totals.sum.toLocaleString('he-IL')}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-amber-300">
                    ₪{totals.cash.toLocaleString('he-IL')}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-blue-300">
                    ₪{totals.credit.toLocaleString('he-IL')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center">
          הסכומים נשמרים אוטומטית במכשיר · מזומן + אשראי = סכום
        </p>
      </div>
    </div>
  );
}