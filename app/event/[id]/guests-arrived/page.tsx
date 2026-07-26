// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function GuestsArrivedPage() {
  const params = useParams();
  const eventId = String(params.id || '1');

  const [guests, setGuests] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'arrived' | 'notArrived' | 'notComing'>('all');
  const [search, setSearch] = useState('');

  const loadData = () => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const current = events.find((e: any) => e.id.toString() === eventId);
    if (current) setEventTitle(current.owners || current.title || '');

    const saved = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');

    const arrivedById = new Map<any, number>();
    const arrivedByName = new Map<string, number>();
    try {
      const arrivedOnly = JSON.parse(
        localStorage.getItem(`arrived_event_${eventId}`) || '[]'
      );
      (arrivedOnly || []).forEach((g: any) => {
        const n = Number(g.arrivedCount) || 0;
        if (n <= 0) return;
        if (g.id != null) arrivedById.set(g.id, n);
        if (g.name) arrivedByName.set(String(g.name).trim(), n);
      });
    } catch {}

    const merged = (saved || []).map((g: any) => {
      const restored =
        arrivedById.get(g.id) ||
        arrivedByName.get(String(g.name || '').trim()) ||
        Number(g.arrivedCount) ||
        0;
      return { ...g, arrivedCount: restored };
    });

    setGuests(merged);
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const getConfirmedQty = (g: any) => {
    const status = String(g.confirmed ?? '').trim();
    if (status === 'לא מגיע') return 0;
    if (status === 'לא ידוע' || status === 'ממתין' || status === '') return 0;
    const n =
      Number(g.confirmedCount) ||
      (Number(status) > 0 ? Number(status) : 0) ||
      Number(g.quantity) ||
      0;
    return n > 0 ? n : 0;
  };

  const isNotComing = (g: any) => String(g.confirmed || '').trim() === 'לא מגיע';
  const isArrived = (g: any) => Number(g.arrivedCount) > 0;
  const isExpected = (g: any) => getConfirmedQty(g) > 0;

  const stats = useMemo(() => {
    let expectedPeople = 0;
    let arrivedPeople = 0;
    let arrivedRows = 0;
    let notArrivedRows = 0;
    let notComingRows = 0;

    guests.forEach((g) => {
      if (isNotComing(g)) {
        notComingRows += 1;
        return;
      }
      const conf = getConfirmedQty(g);
      if (conf > 0) expectedPeople += conf;
      const arr = Number(g.arrivedCount) || 0;
      if (arr > 0) {
        arrivedPeople += arr;
        arrivedRows += 1;
      } else if (conf > 0) {
        notArrivedRows += 1;
      }
    });

    return {
      expectedPeople,
      arrivedPeople,
      missingPeople: Math.max(0, expectedPeople - arrivedPeople),
      arrivedRows,
      notArrivedRows,
      notComingRows,
    };
  }, [guests]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (filter === 'arrived' && !isArrived(g)) return false;
      if (filter === 'notArrived') {
        if (isNotComing(g) || isArrived(g) || !isExpected(g)) return false;
      }
      if (filter === 'notComing' && !isNotComing(g)) return false;

      if (!term) return true;
      return (
        String(g.name || '').toLowerCase().includes(term) ||
        String(g.phone || '').includes(term)
      );
    });
  }, [guests, filter, search]);

  const exportExcel = () => {
         const rows = guests.map((g) => {
      const conf = getConfirmedQty(g);
      const arr = Number(g.arrivedCount) || 0;
      let status = 'ממתין / לא אישר';
      if (isNotComing(g)) status = 'לא מגיע';
      else if (arr > 0) status = 'הגיע';
      else if (conf > 0) status = 'אישר ולא הגיע';

      return {
        שם: g.name || '',
        טלפון: g.phone || '',
        קבוצה: g.group || '',
        אושר: conf || '',
        הגיע: arr || '',
        'סטטוס הגעה': status,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'הגעות');
    XLSX.writeFile(wb, `דוח_הגעות_${eventTitle || eventId}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#f5e8c7] p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/event/${eventId}/guests`}
            className="text-blue-600 hover:underline font-medium"
          >
            ← חזרה לרשימת המוזמנים
          </Link>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="bg-white px-5 py-3 rounded-2xl shadow font-medium hover:bg-gray-50"
            >
              רענן נתונים
            </button>
            <button
              onClick={exportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow"
            >
              📥 הורד דוח Excel
            </button>
          </div>
        </div>

                <h1 className="text-4xl font-bold text-center mb-2 text-amber-900">
          אורחים שהגיעו
          {eventTitle ? ` • ${eventTitle}` : ''}
        </h1>
        {eventTitle && (
          <p className="text-center text-xl text-amber-800 mb-10">{eventTitle}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-3xl shadow p-6 text-center">
            <div className="text-sm text-gray-500">אושרו (אנשים)</div>
            <div className="text-4xl font-bold text-blue-600">{stats.expectedPeople}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6 text-center">
            <div className="text-sm text-gray-500">הגיעו בפועל</div>
            <div className="text-4xl font-bold text-green-600">{stats.arrivedPeople}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6 text-center">
            <div className="text-sm text-gray-500">חסרים</div>
            <div className="text-4xl font-bold text-orange-500">{stats.missingPeople}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6 text-center">
            <div className="text-sm text-gray-500">לא מגיע (רשומות)</div>
            <div className="text-4xl font-bold text-red-500">{stats.notComingRows}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש שם / טלפון..."
            className="flex-1 min-w-[220px] border rounded-2xl px-5 py-3 bg-white"
          />
          {[
            { id: 'all', label: 'הכל' },
            { id: 'arrived', label: `הגיעו (${stats.arrivedRows})` },
            { id: 'notArrived', label: `לא הגיעו (${stats.notArrivedRows})` },
            { id: 'notComing', label: `לא מגיע (${stats.notComingRows})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-5 py-3 rounded-2xl font-medium ${
                filter === f.id
                  ? 'bg-amber-600 text-white'
                  : 'bg-white shadow hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-amber-100">
              <tr>
                <th className="text-right py-4 px-6">שם</th>
                <th className="text-right py-4 px-6">טלפון</th>
                <th className="text-center py-4 px-6">אושר</th>
                <th className="text-center py-4 px-6">הגיע</th>
                <th className="text-center py-4 px-6">סטטוס</th>
                <th className="text-right py-4 px-6">הערות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500 text-lg">
                    אין רשומות להצגה
                  </td>
                </tr>
              ) : (
                filtered.map((g) => {
                  const conf = getConfirmedQty(g);
                  const arr = Number(g.arrivedCount) || 0;
                  let status = 'ממתין';
                  let color = 'text-amber-600';
                  if (isNotComing(g)) {
                    status = 'לא מגיע';
                    color = 'text-red-600';
                  } else if (arr > 0) {
                    status = 'הגיע';
                    color = 'text-green-600';
                  } else if (conf > 0) {
                    status = 'אישר · לא הגיע';
                    color = 'text-orange-600';
                  }

                  return (
                    <tr key={g.id} className="border-t hover:bg-amber-50">
                      <td className="py-4 px-6 font-medium">{g.name}</td>
                      <td className="py-4 px-6 font-mono text-gray-600">{g.phone}</td>
                      <td className="py-4 px-6 text-center font-bold">{conf || '—'}</td>
                      <td className="py-4 px-6 text-center font-bold text-green-700">
                        {arr || '—'}
                      </td>
                      <td className={`py-4 px-6 text-center font-semibold ${color}`}>
                        {status}
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-sm">{g.notes || ''}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          הנתונים נמשכים מדף ההושבה / הושבה מהירה (סימון הגעה בלייב)
        </p>
      </div>
    </div>
  );
}