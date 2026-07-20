'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getGuests, saveGuests, normalizeGuest } from '../lib/guests';

interface Guest {
  id: number;
  name: string;
  phone: string;
  quantity: string;
  group: string;
  transportation: string;
  confirmed: string;
  customerExpectation: string;
  notes: string;
}

/** ניקוי ומבנה טלפון ישראלי */
function normalizePhone(raw: string): string {
  if (!raw) return '';
  let p = raw.toString().trim();

  // הסרת תווים שאינם ספרות (שומרים + רק זמנית)
  p = p.replace(/[^\d+]/g, '');

  // +972 / 972 בהתחלה
  if (p.startsWith('+972')) p = p.slice(4);
  else if (p.startsWith('972')) p = p.slice(3);

  // רק ספרות
  p = p.replace(/\D/g, '');

  // 9 ספרות שמתחילות ב-5 → הוסף 0
  if (p.length === 9 && p.startsWith('5')) {
    p = '0' + p;
  }

  return p;
}

function isValidIsraeliMobile(phone: string): boolean {
  if (!phone) return true; // ריק = מותר
  return phone.length === 10 && phone.startsWith('05');
}

function AddGuestsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '1';

  const [guests, setGuests] = useState<Guest[]>([]);
  const [allTransportation, setAllTransportation] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [eventTitle, setEventTitle] = useState(`אירוע #${eventId}`);

  const groups = ['משפחה', 'חברים', 'עבודה', 'שכנים', 'חברי ילדות', 'לקוחות'];

  const columns: { key: keyof Guest; label: string }[] = [
    { key: 'name', label: 'שם האורח' },
    { key: 'phone', label: 'טלפון' },
    { key: 'quantity', label: 'כמות' },
    { key: 'group', label: 'קבוצה' },
    { key: 'transportation', label: 'הסעה' },
    { key: 'confirmed', label: 'אישור הגעה' },
    { key: 'customerExpectation', label: 'צפי לקוח' },
    { key: 'notes', label: 'הערה' },
  ];

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) setEventTitle(currentEvent.owners || currentEvent.title);
  }, [eventId]);

  const updateGuest = (id: number, field: keyof Guest, value: string) => {
    let finalValue = value;
    if (field === 'phone') {
      finalValue = normalizePhone(value);
    }
    setGuests(prev => prev.map(g => g.id === id ? { ...g, [field]: finalValue } : g));
  };

  const deleteRow = (id: number) => {
    if (!confirm('למחוק את השורה?')) return;
    setGuests(prev => prev.filter(g => g.id !== id));
  };

  /** ניקוי כל העמודה */
  const clearColumn = (field: keyof Guest) => {
    if (!confirm(`למחוק את כל התוכן בעמודת "${field}"?`)) return;
    setGuests(prev => prev.map(g => ({ ...g, [field]: '' })));
  };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, rowIndex: number, field: keyof Guest) => {
    const text = e.clipboardData.getData('text');
    // שומרים גם שורות ריקות – כדי שההדבקה תישאר מיושרת
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    // הדבקה של ערך בודד (בלי ירידות שורה)
    if (lines.length <= 1) {
      if (field === 'phone') {
        e.preventDefault();
        const normalized = normalizePhone(text);
        updateGuest(guests[rowIndex].id, 'phone', normalized);
      }
      return;
    }

    e.preventDefault();

    setGuests(prev => {
      const newGuests = [...prev];

      lines.forEach((value, i) => {
        const idx = rowIndex + i;
        // ריק נשאר ריק – לא מדלגים ולא ממלאים ממקום אחר
        const raw = (value ?? '').trim();
        const finalValue = field === 'phone'
          ? (raw ? normalizePhone(raw) : '')
          : raw;

        if (idx < newGuests.length) {
          (newGuests[idx] as any)[field] = finalValue;
        } else {
          const newG: Guest = {
            id: Date.now() + i,
            name: '',
            phone: '',
            quantity: '',
            group: selectedGroup,
            transportation: allTransportation ? 'כן' : '',
            confirmed: '',
            customerExpectation: '',
            notes: '',
          };
          (newG as any)[field] = finalValue;
          newGuests.push(newG);
        }
      });

      return newGuests;
    });
  };
  const toggleAllTransportation = () => {
    const newVal = !allTransportation;
    setAllTransportation(newVal);
    setGuests(prev => prev.map(g => ({ ...g, transportation: newVal ? 'כן' : '' })));
  };

  const uploadToEvent = () => {
    // רק שם חובה – טלפון יכול להיות ריק
    const validGuests = guests
      .filter(g => g.name.trim() !== '')
      .map(g => ({
        ...g,
        phone: normalizePhone(g.phone),
      }));

    if (validGuests.length === 0) return alert('אין מוזמנים עם שם להעלאה');

    const existing = getGuests(eventId);

    const normalizedNew = validGuests.map(g =>
      normalizeGuest({
        ...g,
        group: (g.group || '').trim() || selectedGroup || '',
      })
    );

    saveGuests(eventId, [...existing, ...normalizedNew]);

    alert(`✅ ${validGuests.length} מוזמנים נשמרו בהצלחה לאירוע!`);
    setGuests([]);
    // מילוי מחדש של שורות ריקות
    const initial = Array.from({ length: 30 }, () => ({
      id: Date.now() + Math.random(),
      name: '', phone: '', quantity: '', group: '',
      transportation: '', confirmed: '', customerExpectation: '', notes: ''
    }));
    setGuests(initial);
  };

  useEffect(() => {
    const initial = Array.from({ length: 30 }, () => ({
      id: Date.now() + Math.random(),
      name: '', phone: '', quantity: '', group: '',
      transportation: '', confirmed: '', customerExpectation: '', notes: ''
    }));
    setGuests(initial);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">הוספת אורחים - {eventTitle}</h1>
        <Link href={`/event/${eventId}/guests`}>
          <button className="px-8 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-2xl font-semibold flex items-center gap-2">
            ← חזרה לרשימת מוזמנים
          </button>
        </Link>
      </div>

      <div className="flex items-center gap-6 mb-8 flex-wrap">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={allTransportation} onChange={toggleAllTransportation} />
          <span>אפשרות הסעה לכולם</span>
        </div>
        <div className="flex items-center gap-2">
          <span>בחר קבוצה קיימת:</span>
          <select
            value={selectedGroup}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedGroup(val);
              if (val) {
                setGuests(prev =>
                  prev.map(g => {
                    const hasData = g.name.trim() !== '' || g.phone.trim() !== '';
                    if (hasData && g.group.trim() === '') {
                      return { ...g, group: val };
                    }
                    return g;
                  })
                );
              }
            }}
            className="border border-slate-300 rounded-xl px-4 py-2 text-sm"
          >
            <option value="">— בחר —</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <button onClick={uploadToEvent} className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold">
          העלה לאירוע
        </button>
      </div>

      <div className="bg-slate-100 rounded-3xl border shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-200 sticky top-0 z-10">
            <tr className="border-b border-slate-300">
              <th className="w-12 py-4 text-center font-semibold text-slate-700">#</th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`py-4 pr-4 text-right font-semibold text-slate-700 border-r border-slate-300 ${col.key === 'quantity' ? 'w-28' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{col.label}</span>
                    <button
                      type="button"
                      title={`נקה את כל עמודת ${col.label}`}
                      onClick={() => clearColumn(col.key)}
                      className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded px-1.5 py-0.5 text-xs font-bold"
                    >
                      ▼
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-slate-100 divide-y divide-slate-200">
            {guests.map((guest, idx) => {
              const phoneInvalid = guest.phone.trim() !== '' && !isValidIsraeliMobile(guest.phone);
              return (
                <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
                  <td className="text-center text-slate-500 py-3 border-r border-slate-200">{idx + 1}</td>
                  <td className="pr-6 border-r border-slate-200">
                    <input
                      value={guest.name}
                      onChange={e => updateGuest(guest.id, 'name', e.target.value)}
                      onPaste={e => handlePaste(e, idx, 'name')}
                      className="w-full py-3.5 outline-none bg-transparent"
                    />
                  </td>
                  <td className="pr-6 border-r border-slate-200">
                    <div>
                      <input
                        value={guest.phone}
                        onChange={e => updateGuest(guest.id, 'phone', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 'phone')}
                        className={`w-full py-3.5 outline-none bg-transparent ${phoneInvalid ? 'text-red-600 font-semibold' : ''}`}
                      />
                      {phoneInvalid && (
                        <div className="text-[11px] text-red-500 -mt-1 mb-1">מס לא תקין</div>
                      )}
                    </div>
                  </td>
                  <td className="pr-6 border-r border-slate-200">
                    <input value={guest.quantity} onChange={e => updateGuest(guest.id, 'quantity', e.target.value)} onPaste={e => handlePaste(e, idx, 'quantity')} className="w-full py-3.5 outline-none text-center bg-transparent" />
                  </td>
                  <td className="pr-6 border-r border-slate-200">
                    <input value={guest.group} onChange={e => updateGuest(guest.id, 'group', e.target.value)} onPaste={e => handlePaste(e, idx, 'group')} className="w-full py-3.5 outline-none bg-transparent" />
                  </td>
                  <td className="pr-6 border-r border-slate-200">
                    <input value={guest.transportation} onChange={e => updateGuest(guest.id, 'transportation', e.target.value)} onPaste={e => handlePaste(e, idx, 'transportation')} className="w-full py-3.5 outline-none bg-transparent" />
                  </td>
                  <td className="pr-6 border-r border-slate-200">
                    <input value={guest.confirmed} onChange={e => updateGuest(guest.id, 'confirmed', e.target.value)} onPaste={e => handlePaste(e, idx, 'confirmed')} className="w-full py-3.5 outline-none bg-transparent" />
                  </td>
                  <td className="pr-6 border-r border-slate-200">
                    <input value={guest.customerExpectation} onChange={e => updateGuest(guest.id, 'customerExpectation', e.target.value)} onPaste={e => handlePaste(e, idx, 'customerExpectation')} className="w-full py-3.5 outline-none bg-transparent" />
                  </td>
                  <td className="pr-6">
                    <input value={guest.notes} onChange={e => updateGuest(guest.id, 'notes', e.target.value)} onPaste={e => handlePaste(e, idx, 'notes')} className="w-full py-3.5 outline-none bg-transparent" />
                  </td>
                  <td className="text-center border-l border-slate-200">
                    <button onClick={() => deleteRow(guest.id)} className="text-red-500 hover:text-red-700 text-xl px-3">×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center text-sm text-slate-500">
        טיפ: בחר תא בכל עמודה → Ctrl + V = הדבקה של רשימה שלמה · לחץ ▼ בכותרת כדי לנקות עמודה שלמה
      </div>
    </div>
  );
}

export default function AddGuestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xl">טוען דף...</div>}>
      <AddGuestsContent />
    </Suspense>
  );
}