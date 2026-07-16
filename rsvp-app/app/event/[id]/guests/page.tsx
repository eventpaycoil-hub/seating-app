// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useParams } from 'next/navigation';

export default function GuestsPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id || "1";

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<number[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState(`אירוע #${eventId}`);
  const [activeFilter, setActiveFilter] = useState<'all' | 'yes' | 'no' | 'unknown' | 'noNote'>('all');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');
    const validGuests = saved.filter((g: any) => g.name && g.name.trim() !== '' && g.phone && g.phone.trim() !== '');
    setGuests(validGuests);

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) setEventTitle(currentEvent.owners || currentEvent.title);
  }, [eventId]);

  const filteredGuests = guests.filter((g: any) => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.phone.includes(searchTerm);

    if (activeFilter === 'yes') return matchesSearch && g.confirmed && g.confirmed.trim() !== '';
    if (activeFilter === 'no') return matchesSearch && g.confirmed && g.confirmed.toLowerCase().includes('לא');
    if (activeFilter === 'unknown') return matchesSearch && (!g.confirmed || g.confirmed.trim() === '') && g.notes && g.notes.trim() !== '';
    if (activeFilter === 'noNote') return matchesSearch && (!g.notes || g.notes.trim() === '');

    return matchesSearch;
  });

  const toggleGuest = (id: number) => {
    setSelectedGuests(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map((g: any) => g.id));
    }
  };

  const deleteSelected = () => {
    if (selectedGuests.length === 0) return alert("לא בחרת מוזמנים");
    if (!confirm(`למחוק ${selectedGuests.length} מוזמנים?`)) return;

    const key = `guests_event_${eventId}`;
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = saved.filter((g: any) => !selectedGuests.includes(g.id));
    localStorage.setItem(key, JSON.stringify(updated));
    setGuests(updated);
    setSelectedGuests([]);
  };

  // === תיקון SMS ===
  const sendSMS = () => {
    if (selectedGuests.length === 0) {
      alert("לא בחרת מוזמנים");
      return;
    }
    localStorage.setItem('selectedForSMS', JSON.stringify(selectedGuests));
    window.location.href = `/event/${eventId}/sms`;
  };

  const sendWhatsApp = () => {
    if (selectedGuests.length === 0) {
      alert("לא בחרת מוזמנים");
      return;
    }
    localStorage.setItem('selectedForWhatsApp', JSON.stringify(selectedGuests));
    window.location.href = `/event/${eventId}/whatsapp-templates`;
  };

  const totalRows = guests.length;
  const totalConfirmed = guests.filter((g: any) => g.confirmed && g.confirmed.trim() !== '').length;
  const totalNo = guests.filter((g: any) => g.confirmed && g.confirmed.toLowerCase().includes('לא')).length;
  const totalUnknown = guests.filter((g: any) => (!g.confirmed || g.confirmed.trim() === '') && g.notes && g.notes.trim() !== '').length;
  const totalNoNote = guests.filter((g: any) => !g.notes || g.notes.trim() === '').length;

  const exportToExcel = () => {
    const data = guests.map((g: any) => ({
      שם: g.name,
      טלפון: g.phone,
      קבוצה: g.group || '',
      צפי: g.quantity,
      סטטוס: g.confirmed ? 'אישר' : 'ממתין',
      הסעה: g.transport || '',
      הערות: g.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "מוזמנים");
    XLSX.writeFile(wb, "רשימת_מוזמנים.xlsx");
  };

  return (
    <div className="min-h-screen bg-zinc-50" dir="rtl">
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-gray-800">
              {eventId === "1" ? "מנהל" : eventTitle}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mt-6 text-sm">
            <Link href="/" className="flex flex-col items-center text-gray-600 hover:text-blue-600">🏠 עמוד הבית</Link>
            <Link href="/videos" className="flex flex-col items-center text-gray-600 hover:text-blue-600">🎥 וידאו האירוע</Link>
            <Link href="/gallery" className="flex flex-col items-center text-gray-600 hover:text-blue-600">🖼 תמונת האירוע</Link>
            <Link href={`/event/${eventId}/groups`} className="flex flex-col items-center text-gray-600 hover:text-blue-600">👥 קבוצות המוזמנים</Link>
            <Link href="/venue" className="flex flex-col items-center text-gray-600 hover:text-blue-600">📍 רשומות WAZE</Link>
            <Link href={`/add-guests?eventId=${eventId}`} className="flex flex-col items-center text-gray-600 hover:text-blue-600">➕ הוספת מוזמנים</Link>
            <Link href="/seating-arrival" className="flex flex-col items-center text-gray-600 hover:text-blue-600">🪑 הושבת מוזמנים באירוע</Link>
            <Link href="/seating-arrival-fast" className="flex flex-col items-center text-gray-600 hover:text-blue-600 bg-white p-6 rounded-3xl shadow hover:shadow-xl w-40 text-center font-bold">
              ⚡ הושבה מהירה
            </Link>
            <Link href="/guests-arrived" className="flex flex-col items-center text-gray-600 hover:text-blue-600">✅ אורחים שהגיעו</Link>
            <Link href="/addtable" className="flex flex-col items-center text-gray-600 hover:text-blue-600">➕ הוספת שולחנות</Link>
            <Link href="/pricing" className="flex flex-col items-center text-gray-600 hover:text-blue-600">💰 הצעות מחיר</Link>
            <Link href="/pricing-view" className="flex flex-col items-center text-gray-600 hover:text-blue-600">👀 צפיה בהצעות מחיר</Link>
            <Link href="/events" className="flex flex-col items-center text-gray-600 hover:text-blue-600">📅 רשימת האירועים</Link>
            <Link href={`/event/${eventId}/edit`} className="flex flex-col items-center text-gray-600 hover:text-blue-600">✏️ עריכת פרטי אירוע</Link>
            <Link href={`/event/${eventId}/sms`} className="flex flex-col items-center text-gray-600 hover:text-blue-600 bg-white p-6 rounded-3xl shadow hover:shadow-xl w-40 text-center">📩 SMS</Link>
            <Link href="/whatsapp-templates" className="flex flex-col items-center text-gray-600 hover:text-blue-600">💬 תבניות ווטסאפ</Link>
            <Link href="/transport?eventId=1" className="flex flex-col items-center text-gray-600 hover:text-blue-600">🚌 הסעות</Link>
            <Link href={`/seating`} className="flex flex-col items-center text-gray-600 hover:text-blue-600 font-bold">🪑 סקיצה אולם</Link>
            <Link href="/create-event" className="flex flex-col items-center text-gray-600 hover:text-blue-600 font-bold">➕ פתח אירוע חדש</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="text-3xl font-bold">רשימת מוזמנים</div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setActiveFilter('all')} className={`px-7 py-3.5 rounded-2xl font-medium transition-all ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>כל המוזמנים ({totalRows})</button>
            <button onClick={() => setActiveFilter('yes')} className={`px-7 py-3.5 rounded-2xl font-medium transition-all ${activeFilter === 'yes' ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'}`}>יגיעו ({totalConfirmed})</button>
            <button onClick={() => setActiveFilter('no')} className={`px-7 py-3.5 rounded-2xl font-medium transition-all ${activeFilter === 'no' ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}>לא יגיעו ({totalNo})</button>
            <button onClick={() => setActiveFilter('unknown')} className={`px-7 py-3.5 rounded-2xl font-medium transition-all ${activeFilter === 'unknown' ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white'}`}>לא ידוע ({totalUnknown})</button>
            <button onClick={() => setActiveFilter('noNote')} className={`px-7 py-3.5 rounded-2xl font-medium transition-all ${activeFilter === 'noNote' ? 'bg-orange-500 text-white' : 'bg-orange-400 text-white'}`}>לא ידוע ({totalNoNote})</button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <input type="text" placeholder="חיפוש..." className="flex-1 md:w-64 p-4 border border-gray-300 rounded-2xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button onClick={sendSMS} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-medium hover:bg-blue-700">📩 SMS</button>
            <button onClick={sendWhatsApp} className="bg-green-600 text-white px-6 py-4 rounded-2xl font-medium hover:bg-green-700">💬 ווטסאפ</button>
            <button onClick={deleteSelected} className="bg-red-600 text-white px-6 py-4 rounded-2xl font-medium hover:bg-red-700">🗑 מחק מסומנים</button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-5 text-center w-12">
                  <input type="checkbox" checked={filteredGuests.length > 0 && selectedGuests.length === filteredGuests.length} onChange={toggleSelectAll} className="w-5 h-5 accent-blue-600" />
                </th>
                <th className="px-6 py-5 text-center">#</th>
                <th className="px-6 py-5 text-center">אירוע</th>
                <th className="px-6 py-5 text-right">שם</th>
                <th className="px-6 py-5 text-right">טלפון</th>
                <th className="px-6 py-5 text-right">קבוצה</th>
                <th className="px-6 py-5 text-center">צפי</th>
                <th className="px-6 py-5 text-center">אישור הגעה</th>
                <th className="px-6 py-5 text-center">הסעה</th>
                <th className="px-6 py-5 text-center">סטטוס</th>
                <th className="px-6 py-5 text-center">הערה</th>
                <th className="px-6 py-5 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest: any, index: number) => (
                <tr key={guest.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-5 text-center">
                    <input type="checkbox" checked={selectedGuests.includes(guest.id)} onChange={() => toggleGuest(guest.id)} className="w-5 h-5 accent-blue-600" />
                  </td>
                  <td className="px-6 py-5 text-center text-gray-500 font-medium">{index + 1}</td>
                  <td className="px-6 py-5 text-center text-blue-600 font-medium">{eventTitle}</td>
                  <td className="px-6 py-5 font-medium">{guest.name}</td>
                  <td className="px-6 py-5 text-gray-600 font-mono">{guest.phone}</td>
                  <td className="px-6 py-5">{guest.group}</td>
                  <td className="px-6 py-5 text-center font-bold">{guest.quantity}</td>
                  <td className="px-6 py-5 text-center text-sm font-mono">{guest.confirmed || ''}</td>
                  <td className="px-6 py-5 text-center font-medium text-blue-600">{guest.transport || '-'}</td>
                  <td className="px-6 py-5 text-center">
                    {guest.confirmed && guest.confirmed.trim() !== '' ? (
                      <div className="flex flex-col items-center">
                        <div className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-2xl text-3xl font-bold flex items-center justify-center w-14 h-14">✅</div>
                        <div className="text-emerald-600 font-medium mt-1 text-sm">{guest.confirmed}</div>
                      </div>
                    ) : (
                      <span className="inline-block px-4 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">⏳ ממתין</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-gray-600 text-sm">{guest.notes}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex gap-2 justify-center">
                      <Link href={`/event/${eventId}/guests/${guest.id}/edit`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-2xl text-sm font-medium">✏️ ערוך</Link>
                      <button onClick={() => {
                        if (confirm(`למחוק את ${guest.name}?`)) {
                          const key = `guests_event_${eventId}`;
                          const saved = JSON.parse(localStorage.getItem(key) || '[]');
                          const updated = saved.filter((g: any) => g.id !== guest.id);
                          localStorage.setItem(key, JSON.stringify(updated));
                          setGuests(updated);
                        }
                      }} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-5 py-2 rounded-2xl text-sm font-medium">🗑 מחק</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}