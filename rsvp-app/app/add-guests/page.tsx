'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

export default function AddGuestsPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '1';

  const [guests, setGuests] = useState<Guest[]>([]);
  const [allTransportation, setAllTransportation] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [eventTitle, setEventTitle] = useState(`אירוע #${eventId}`);

  const groups = ['משפחה', 'חברים', 'עבודה', 'שכנים', 'חברי ילדות', 'לקוחות'];

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) setEventTitle(currentEvent.owners || currentEvent.title);
  }, [eventId]);

  const updateGuest = (id: number, field: keyof Guest, value: string) => {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const deleteRow = (id: number) => {
    if (!confirm('למחוק את השורה?')) return;
    setGuests(prev => prev.filter(g => g.id !== id));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, rowIndex: number, field: keyof Guest) => {
    const text = e.clipboardData.getData('text');
    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) return;
    e.preventDefault();

    setGuests(prev => {
      let newGuests = [...prev];
      lines.forEach((value, i) => {
        const idx = rowIndex + i;
        if (idx < newGuests.length) {
          (newGuests[idx] as any)[field] = value;
        } else {
          const newG: Guest = {
            id: Date.now() + i,
            name: '', phone: '', quantity: '', group: selectedGroup,
            transportation: allTransportation ? 'כן' : '',
            confirmed: '', customerExpectation: '', notes: ''
          };
          (newG as any)[field] = value;
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
    const validGuests = guests.filter(g => g.name.trim() !== '' && g.phone.trim() !== '');

    if (validGuests.length === 0) return alert('אין מוזמנים תקינים להעלאה');

    const key = `guests_event_${eventId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');

    localStorage.setItem(key, JSON.stringify([...existing, ...validGuests]));

    alert(`✅ ${validGuests.length} מוזמנים נשמרו בהצלחה לאירוע #${eventId}!`);
    setGuests([]);
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
    <div className="max-w-[1600px] mx-auto px-6 py-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">הוספת אורחים - {eventTitle}</h1>

        <Link href={`/event/${eventId}/guests`}>
          <button className="px-8 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-2xl font-semibold flex items-center gap-2">
            ← חזרה לרשימת מוזמנים
          </button>
        </Link>
      </div>

      <div className="flex items-center gap-6 mb-8">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={allTransportation} onChange={toggleAllTransportation} />
          <span>אפשרות הסעה לכולם</span>
        </div>

        <div className="flex items-center gap-2">
          <span>בחר קבוצה קיימת:</span>
          <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-2 text-sm">
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
              <th className="py-4 pr-6 text-right font-semibold text-slate-700 border-r border-slate-300">שם האורח</th>
              <th className="py-4 pr-6 text-right font-semibold text-slate-700 border-r border-slate-300">טלפון</th>
              <th className="w-28 py-4 pr-6 text-right font-semibold text-slate-700 border-r border-slate-300">כמות</th>
              <th className="py-4 pr-6 text-right font-semibold text-slate-700 border-r border-slate-300">קבוצה</th>
              <th className="py-4 pr-6 text-right font-semibold text-slate-700 border-r border-slate-300">הסעה</th>
              <th className="py-4 pr-6 text-right font-semibold text-slate-700 border-r border-slate-300">אישור הגעה</th>
              <th className="py-4 pr-6 text-right font-semibold text-slate-700 border-r border-slate-300">צפי לקוח</th>
              <th className="py-4 pr-6 text-right font-semibold text-slate-700">הערה</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-slate-100 divide-y divide-slate-200">
            {guests.map((guest, idx) => (
              <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
                <td className="text-center text-slate-500 py-3 border-r border-slate-200">{idx + 1}</td>
                
                <td className="pr-6 border-r border-slate-200">
                  <input value={guest.name} onChange={e => updateGuest(guest.id, 'name', e.target.value)} onPaste={e => handlePaste(e, idx, 'name')} className="w-full py-3.5 outline-none bg-transparent" />
                </td>
                
                <td className="pr-6 border-r border-slate-200">
                  <input value={guest.phone} onChange={e => updateGuest(guest.id, 'phone', e.target.value)} onPaste={e => handlePaste(e, idx, 'phone')} className="w-full py-3.5 outline-none bg-transparent" />
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
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center text-sm text-slate-500">
        טיפ: בחר תא בכל עמודה → Ctrl + V = הדבקה של רשימה שלמה
      </div>
    </div>
  );
}
// force rebuild - 15/07/2026