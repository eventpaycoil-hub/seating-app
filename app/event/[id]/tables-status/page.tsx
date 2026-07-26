// @ts-nocheck
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface TableRow {
  id: number | string;
  name: string;
  tableNumber: number;
  seats: number;
  arrived: number;
  notArrived: number;
  notSeated: number;
  free: number;
  seated: number;
}

export default function TablesStatusPage() {
  const params = useParams();
  const eventId = String(params.id || '1');

  const [rows, setRows] = useState<TableRow[]>([]);
  const [sortMode, setSortMode] = useState<'number' | 'free'>('number');
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    const tablesRaw = JSON.parse(localStorage.getItem('seatingTables') || '[]');
    const guests = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');

    const isArrived = (g: any) =>
      g.arrived === true ||
      g.arrived === 'כן' ||
      Number(g.arrivedCount) > 0 ||
      g.status === 'הגיע';

    const mapped: TableRow[] = (Array.isArray(tablesRaw) ? tablesRaw : [])
      .filter((t: any) => Number(t.seats) > 0)
      .map((t: any) => {
        const assigned: string[] = t.assignedGuests || [];
        const seated = assigned.length;

        const seatedGuests = guests.filter((g: any) =>
          assigned.some((n: string) => String(n).trim() === String(g.name || '').trim())
        );

        const arrived = seatedGuests.filter(isArrived).length;
        const notArrived = Math.max(0, seated - arrived);
        const notSeated = Math.max(0, Number(t.seats) - seated);

        return {
          id: t.id,
          name: t.name || t.label || 'שם השולחן',
          tableNumber: Number(t.tableNumber) || 0,
          seats: Number(t.seats) || 0,
          arrived,
          notArrived,
          notSeated,
          free: notSeated,
          seated,
        };
      });

    setRows(mapped);
  }, [eventId]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sortMode === 'number') {
      copy.sort((a, b) => a.tableNumber - b.tableNumber);
    } else {
      copy.sort((a, b) => b.free - a.free || a.tableNumber - b.tableNumber);
    }
    return copy;
  }, [rows, sortMode]);

  const totals = useMemo(
    () =>
      sorted.reduce(
        (acc, r) => ({
          seats: acc.seats + r.seats,
          arrived: acc.arrived + r.arrived,
          notArrived: acc.notArrived + r.notArrived,
          notSeated: acc.notSeated + r.notSeated,
        }),
        { seats: 0, arrived: 0, notArrived: 0, notSeated: 0 }
      ),
    [sorted]
  );

  /** המלצה בזמן אמת: מאיפה לקחת כיסא ולאן להשלים */
  const recommendMove = () => {
    if (rows.length === 0) {
      setTip('אין שולחנות בסקיצה');
      return;
    }

    // שולחנות עם עודף (פנויים) – מהכי הרבה פנויים
    const donors = [...rows]
      .filter((r) => r.free > 0)
      .sort((a, b) => b.free - a.free);

    // שולחנות לחוצים: ישובים מלא / כמעט מלא, או טרם הגיעו גבוה ביחס לקיבולת
    const needy = [...rows]
      .filter((r) => r.free === 0 || r.notArrived > 0)
      .sort((a, b) => {
        // עדיפות: מלא לגמרי + יש טרם הגיעו (לחץ)
        const score = (r: TableRow) => (r.free === 0 ? 100 : 0) + r.notArrived * 10 - r.free;
        return score(b) - score(a);
      });

    if (donors.length === 0) {
      setTip('אין כיסאות פנויים באף שולחן – כל השולחנות מלאים או בלי מקומות פנויים.');
      return;
    }

    const donor = donors[0];

    // יעד: שולחן מלא / כמעט מלא שצריך עזרה, לא אותו שולחן
    const target =
      needy.find((r) => r.tableNumber !== donor.tableNumber && r.free === 0) ||
      needy.find((r) => r.tableNumber !== donor.tableNumber) ||
      null;

    if (!target) {
      setTip(
        `יש ${donor.free} מקומות פנויים בשולחן ${donor.tableNumber}` +
          (donor.name ? ` (${donor.name})` : '') +
          '. אין כרגע שולחן שלוחץ שצריך השלמה.'
      );
      return;
    }

    setTip(
      `💡 המלצה:\n` +
        `קח כיסא פנוי משולחן ${donor.tableNumber}` +
        (donor.name ? ` – ${donor.name}` : '') +
        ` (פנויים: ${donor.free})\n` +
        `והשלם לשולחן ${target.tableNumber}` +
        (target.name ? ` – ${target.name}` : '') +
        (target.free === 0 ? ' (מלא / בלחץ)' : ` (פנויים: ${target.free})`) +
        (target.notArrived > 0 ? ` · טרם הגיעו: ${target.notArrived}` : '')
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline font-medium">
            ← חזרה
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">מצב שולחנות נוכחי</h1>
          <button
            onClick={recommendMove}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold shadow"
          >
            💡 המלץ מאיפה לקחת כיסא
          </button>
        </div>

        {tip && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-2xl p-5 whitespace-pre-line text-lg font-medium shadow-sm">
            {tip}
            <button
              onClick={() => setTip(null)}
              className="block mt-3 text-sm text-amber-700 underline"
            >
              סגור
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-slate-300">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="border border-slate-500 text-right py-4 px-4 font-bold">שם</th>
                <th
                  className="border border-slate-500 text-right py-4 px-4 font-bold cursor-pointer hover:bg-slate-600"
                  onClick={() => setSortMode((m) => (m === 'number' ? 'free' : 'number'))}
                >
                  מספר שולחן {sortMode === 'number' ? '▼' : ''}
                </th>
                <th className="border border-slate-500 text-right py-4 px-4 font-bold">מקומות ישיבה</th>
                <th className="border border-slate-500 text-right py-4 px-4 font-bold">הגיעו</th>
                <th
                  className="border border-slate-500 text-right py-4 px-4 font-bold cursor-pointer hover:bg-slate-600 bg-emerald-800"
                  onClick={() => setSortMode('free')}
                >
                  טרם הגיעו {sortMode === 'free' ? '▼' : ''}
                </th>
                <th className="border border-slate-500 text-right py-4 px-4 font-bold">לא הושבו</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 text-xl border border-slate-200">
                    אין שולחנות בסקיצה
                  </td>
                </tr>
              ) : (
                sorted.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={
                      r.free === 0
                        ? 'bg-red-50'
                        : r.free >= 3
                        ? 'bg-emerald-50'
                        : idx % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50'
                    }
                  >
                    <td className="border border-slate-200 py-3 px-4">{r.name}</td>
                    <td className="border border-slate-200 py-3 px-4 font-bold text-lg">{r.tableNumber}</td>
                    <td className="border border-slate-200 py-3 px-4">{r.seats}</td>
                    <td className="border border-slate-200 py-3 px-4 text-green-700 font-semibold">{r.arrived}</td>
                    <td className="border border-slate-200 py-3 px-4 text-emerald-700 font-semibold">{r.notArrived}</td>
                    <td className="border border-slate-200 py-3 px-4 font-semibold">{r.notSeated}</td>
                  </tr>
                ))
              )}
            </tbody>
            {sorted.length > 0 && (
              <tfoot>
                <tr className="bg-slate-200 font-bold">
                  <td className="border border-slate-300 py-4 px-4">סה&quot;כ</td>
                  <td className="border border-slate-300 py-4 px-4">{sorted.length} שולחנות</td>
                  <td className="border border-slate-300 py-4 px-4">{totals.seats}</td>
                  <td className="border border-slate-300 py-4 px-4">{totals.arrived}</td>
                  <td className="border border-slate-300 py-4 px-4">{totals.notArrived}</td>
                  <td className="border border-slate-300 py-4 px-4">{totals.notSeated}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 justify-center">
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-red-50 border border-red-200" /> מלא / בלחץ
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200" /> 3+ פנויים
          </span>
          <span>לחיצה על כותרת – מיון</span>
        </div>
      </div>
    </div>
  );
}