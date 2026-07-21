// @ts-nocheck
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, RefreshCw, Printer, ArrowLeft, UserPlus } from 'lucide-react';

export default function SeatingArrivalFastPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [allGuests, setAllGuests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [forceEmptyList, setForceEmptyList] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [tableMapVersion, setTableMapVersion] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);

  const tableMap = useMemo(() => {
    const map = new Map<string, number>();
    try {
      const saved = localStorage.getItem('seatingTables');
      if (!saved) return map;
      const seatingData = JSON.parse(saved);
      if (Array.isArray(seatingData)) {
        seatingData.forEach((table: any) => {
          if (table.tableNumber && Array.isArray(table.assignedGuests)) {
            table.assignedGuests.forEach((guestName: string) => {
              if (guestName && typeof guestName === 'string') {
                map.set(guestName.trim().toLowerCase(), table.tableNumber);
              }
            });
          }
        });
      }
    } catch (e) {
      console.error('Error loading seating data', e);
    }
    return map;
  }, [tableMapVersion]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'seatingTables') setTableMapVersion((prev) => prev + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!eventId) return;

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId);
    if (currentEvent) setEventTitle(currentEvent.owners || currentEvent.title || '');

    const guestsKey = `guests_event_${eventId}`;
    const saved = JSON.parse(localStorage.getItem(guestsKey) || '[]');

    const guestsWithData = saved.map((g: any) => ({
      ...g,
      arrivedCount: Number(g.arrivedCount) || 0,
      confirmedCount:
        Number(g.confirmedCount) ||
        (Number(g.confirmed) > 0 ? Number(g.confirmed) : 0) ||
        Number(g.quantity) ||
        0,
    }));

    setAllGuests(guestsWithData);
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

  const confirmedPeople = allGuests.reduce((total, g) => total + getConfirmedQty(g), 0);
  const arrivedCount = allGuests.reduce((sum, g) => sum + (Number(g.arrivedCount) || 0), 0);
  const stillNotArrived = Math.max(0, confirmedPeople - arrivedCount);

  const filteredGuests = useMemo(() => {
    if (forceEmptyList) return [];
    if (!searchTerm.trim()) return allGuests;
    const term = searchTerm.toLowerCase().trim();
    return allGuests.filter(
      (g: any) =>
        g.name?.toLowerCase().includes(term) || g.phone?.includes(searchTerm.trim())
    );
  }, [allGuests, searchTerm, forceEmptyList]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setForceEmptyList(false);
  };

  const markArrival = (id: number, count: number) => {
    const updated = allGuests.map((guest) =>
      guest.id === id ? { ...guest, arrivedCount: count } : guest
    );
    setAllGuests(updated);
    localStorage.setItem(`guests_event_${eventId}`, JSON.stringify(updated));
    setSearchTerm('');
    setForceEmptyList(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setForceEmptyList(false);
  };

  const refresh = () => {
    setSearchTerm('');
    setForceEmptyList(false);
    setTableMapVersion((prev) => prev + 1);
  };

  const addLiveGuest = () => {
    const name = newName.trim();
    if (!name) {
      alert('נא להזין שם');
      return;
    }
    const qty = Math.min(5, Math.max(1, Number(newQty) || 1));
    const newGuest = {
      id: Date.now() + Math.random(),
      name,
      phone: '',
      quantity: String(qty),
      confirmed: String(qty),
      confirmedCount: qty,
      arrivedCount: qty, // נוסף בלייב = גם הגיע
      notes: 'נוסף בלייב – ללא הושבה',
      group: '',
      transportation: '',
      customerExpectation: '',
    };
    const updated = [...allGuests, newGuest];
    setAllGuests(updated);
    localStorage.setItem(`guests_event_${eventId}`, JSON.stringify(updated));
    setNewName('');
    setNewQty(1);
    setShowAddModal(false);
    setSearchTerm('');
    setForceEmptyList(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const printPage = () => {
    let seatingData: any[] = [];
    try {
      seatingData = JSON.parse(localStorage.getItem('seatingTables') || '[]');
    } catch {
      seatingData = [];
    }

    const tables = (Array.isArray(seatingData) ? seatingData : [])
      .filter((t) => Number(t.seats) > 0)
      .sort((a, b) => Number(a.tableNumber) - Number(b.tableNumber));

    const qtyByName = new Map<string, number>();
    allGuests.forEach((g) => {
      const q = getConfirmedQty(g);
      if (g.name && q > 0) qtyByName.set(String(g.name).trim().toLowerCase(), q);
    });

    const boxesHtml = tables
      .map((t) => {
        const names: string[] = Array.isArray(t.assignedGuests) ? t.assignedGuests : [];
        let total = 0;
        const lines =
          names.length === 0
            ? '<div style="color:#888;margin-top:8px">בשולחן זה לא יושבים מוזמנים</div>'
            : names
                .map((n) => {
                  const q = qtyByName.get(String(n).trim().toLowerCase()) || 1;
                  total += q;
                  return `<div>${n} <strong>(${q})</strong></div>`;
                })
                .join('');

        const title =
          t.name && t.name !== 'שם השולחן'
            ? `שולחן מספר ${t.tableNumber} ("${t.name}")`
            : `שולחן מספר ${t.tableNumber} ("שם השולחן")`;

        return `
          <div style="
            border:1px solid #333;
            padding:12px 14px;
            margin:0;
            break-inside:avoid;
            page-break-inside:avoid;
            font-size:13px;
            line-height:1.45;
          ">
            <div style="font-weight:bold;color:#3b5b8a;margin-bottom:8px;font-size:15px">${title}</div>
            ${lines}
            ${names.length > 0 ? `<div style="margin-top:8px;font-weight:bold">(סה"כ ${total} מוזמנים)</div>` : ''}
          </div>`;
      })
      .join('');

    const w = window.open('', '_blank');
    if (!w) {
      alert('אפשר חלונות קופצים כדי להדפיס');
      return;
    }
    w.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8" />
  <title>הושבה מהירה – ${eventTitle || eventId}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 16px; color: #111; }
    h1 { text-align: center; font-size: 20px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media print { body { padding: 8px; } }
  </style>
</head>
<body>
  <h1>הושבה מהירה ${eventTitle ? '• ' + eventTitle : ''}</h1>
  <div class="grid">
    ${boxesHtml || '<p>אין שולחנות בסקיצה</p>'}
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <div className="min-h-screen bg-[#f5e8c7] p-8" dir="rtl">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <Link
            href={`/event/${eventId}/guests`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={20} /> חזרה לרשימת המוזמנים
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center mb-8 text-amber-900">
          הושבה מהירה {eventTitle && `• ${eventTitle}`}
        </h1>

        <div className="flex justify-center gap-8 mb-12 flex-wrap">
          <div className="bg-white px-10 py-6 rounded-3xl shadow text-center min-w-[260px]">
            <div className="text-sm text-gray-500 mb-1">אישרו</div>
            <div className="text-5xl font-bold text-blue-600">{confirmedPeople}</div>
          </div>
          <div className="bg-white px-10 py-6 rounded-3xl shadow text-center min-w-[260px]">
            <div className="text-sm text-gray-500 mb-1">הגיעו</div>
            <div className="text-5xl font-bold text-green-600">{arrivedCount}</div>
          </div>
          <div className="bg-white px-10 py-6 rounded-3xl shadow text-center min-w-[260px]">
            <div className="text-sm text-gray-500 mb-1">עדיין לא הגיעו</div>
            <div className="text-5xl font-bold text-orange-500">{stillNotArrived}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-10 justify-center flex-wrap">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-6 top-5 text-gray-400" size={24} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="חיפוש שם או טלפון..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white border border-gray-300 rounded-3xl text-xl focus:outline-none focus:border-amber-600"
            />
          </div>
          <button onClick={clearSearch} className="bg-white px-8 py-5 rounded-3xl shadow hover:bg-gray-100 font-medium">
            נקה
          </button>
          <button
            onClick={refresh}
            className="bg-white px-8 py-5 rounded-3xl shadow hover:bg-gray-100 flex items-center gap-2 font-medium"
          >
            <RefreshCw size={20} /> רענן שולחנות
          </button>
          <button
            onClick={printPage}
            className="bg-amber-600 text-white px-8 py-5 rounded-3xl shadow hover:bg-amber-700 flex items-center gap-2 font-medium"
          >
            <Printer size={20} /> PDF
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-8 py-5 rounded-3xl shadow hover:bg-blue-700 flex items-center gap-2 font-medium"
          >
            <UserPlus size={20} /> הוסף מוזמן
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-amber-100">
              <tr>
                <th className="text-right py-5 px-8">שם וטלפון</th>
                <th className="text-center py-5 px-8">מס שולחן</th>
                <th className="text-center py-5 px-8">סטטוס</th>
                <th className="text-center py-5 px-8">הגיע</th>
                <th className="text-center py-5 px-8">התאמה</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length > 0 ? (
                filteredGuests.map((guest: any) => {
                  const confirmed =
                    getConfirmedQty(guest) || guest.confirmedCount || guest.quantity || 1;
                  const isAlreadyArrived = guest.arrivedCount > 0;
                  const isNotComing = guest.confirmed === 'לא מגיע';
                  const isPending =
                    !guest.confirmed ||
                    guest.confirmed === '' ||
                    guest.confirmed === 'לא ידוע' ||
                    guest.confirmed === 'ממתין';
                  const tableNum = tableMap.get(guest.name?.trim().toLowerCase());

                  return (
                    <tr key={guest.id} className="border-b hover:bg-amber-50">
                      <td className="py-6 px-8">
                        <div className="font-semibold text-xl">{guest.name}</div>
                        <div className="text-gray-600 font-mono">{guest.phone}</div>
                      </td>
                      <td className="py-6 px-8 text-center font-bold text-xl text-amber-700">
                        {tableNum ? `שולחן ${tableNum}` : 'אורח לא הושב'}
                      </td>
                      <td className="py-6 px-8 text-center">
                        {isNotComing ? (
                          <div className="flex flex-col items-center">
                            <div className="bg-red-100 text-red-600 w-14 h-14 rounded-2xl flex items-center justify-center text-4xl font-bold">
                              ❌
                            </div>
                            <div className="text-red-600 font-semibold text-sm mt-1">לא מגיע</div>
                          </div>
                        ) : isPending ? (
                          <div className="flex flex-col items-center">
                            <div className="text-4xl">⏳</div>
                            <div className="text-amber-600 font-medium text-sm mt-1">ממתין</div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="bg-emerald-100 text-emerald-700 w-14 h-14 rounded-2xl flex items-center justify-center text-4xl font-bold">
                              ✅
                            </div>
                            <div className="text-emerald-700 font-semibold text-lg mt-1">{confirmed}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-6 px-8 text-center">
                        {isAlreadyArrived ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="bg-gray-400 text-white px-8 py-4 rounded-3xl font-bold text-2xl shadow">
                              אורח זה כבר הגיע
                            </div>
                            <div className="text-gray-600 font-semibold">הגיע {guest.arrivedCount}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => markArrival(guest.id, confirmed)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-14 py-5 rounded-3xl font-bold text-2xl shadow"
                          >
                            {confirmed} הגיע
                          </button>
                        )}
                      </td>
                      <td className="py-6 px-8 text-center">
                        {isAlreadyArrived ? (
                          <button
                            onClick={() => markArrival(guest.id, 0)}
                            className="px-8 py-4 rounded-3xl border-2 border-red-300 text-red-600 hover:bg-red-50 font-medium transition"
                          >
                            בטל הגעה
                          </button>
                        ) : (
                          <div className="flex gap-2 justify-center flex-wrap">
                            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                              <button
                                key={num}
                                onClick={() => markArrival(guest.id, num)}
                                className="w-12 h-12 rounded-2xl font-bold text-lg border-2 bg-white border-gray-300 hover:bg-emerald-50 transition-all"
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-500 text-xl">
                    {forceEmptyList ? 'הרשימה נוקתה. חפש מוזמן חדש...' : 'לא נמצאו תוצאות'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center">הוסף מוזמן (ללא הושבה)</h2>
            <label className="block text-sm font-medium mb-2">שם</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 mb-5 text-lg"
              placeholder="שם מלא"
              autoFocus
            />
            <label className="block text-sm font-medium mb-2">כמות (1–5)</label>
            <select
              value={newQty}
              onChange={(e) => setNewQty(Number(e.target.value))}
              className="w-full border rounded-2xl px-4 py-3 mb-8 text-lg"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border rounded-2xl font-medium"
              >
                ביטול
              </button>
              <button
                onClick={addLiveGuest}
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold"
              >
                ללא הושבה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}