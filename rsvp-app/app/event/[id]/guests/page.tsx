'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useParams } from 'next/navigation';

export default function GuestsPage() {
  const params = useParams();
  const eventId = params.id || "1";

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<number[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState(`אירוע #${eventId}`);
  const [activeFilter, setActiveFilter] = useState<'all' | 'yes' | 'no' | 'unknown' | 'unknownEmpty' | 'noNote'>('all');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');
    const validGuests = saved.filter((g: any) => g.name && g.name.trim() !== '' && g.phone && g.phone.trim() !== '');
    setGuests(validGuests);

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) setEventTitle(currentEvent.owners || currentEvent.title);
  }, [eventId]);

  const yesCount = guests.filter((g: any) => g.confirmed && !isNaN(Number(g.confirmed)) && Number(g.confirmed) >= 1).length;
  const noCount = guests.filter((g: any) => g.confirmed === 'לא מגיע').length;

  const unknownWithNoteCount = guests.filter((g: any) => {
    const isPending = !g.confirmed || g.confirmed === '' || g.confirmed === 'לא ידוע' || g.confirmed === 'ממתין';
    return isPending && g.notes && g.notes.trim() !== '';
  }).length;

  const unknownEmptyCount = guests.filter((g: any) => {
    const isPending = !g.confirmed || g.confirmed === '' || g.confirmed === 'לא ידוע' || g.confirmed === 'ממתין';
    return isPending && (!g.notes || g.notes.trim() === '');
  }).length;

  // תיקון: משתמשים ב-count אם קיים, אחרת ב-quantity (צפי נשאר קבוע)
  const totalConfirmedPeople = guests
    .filter((g: any) => g.confirmed && !isNaN(Number(g.confirmed)) && Number(g.confirmed) >= 1)
    .reduce((sum, g) => sum + (Number(g.count) || Number(g.quantity) || 1), 0);

  const filteredGuests = guests.filter((g: any) => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.phone.includes(searchTerm);
    if (activeFilter === 'yes') return matchesSearch && g.confirmed && !isNaN(Number(g.confirmed)) && Number(g.confirmed) >= 1;
    if (activeFilter === 'no') return matchesSearch && g.confirmed === 'לא מגיע';
    if (activeFilter === 'unknown') {
      const isPending = !g.confirmed || g.confirmed === '' || g.confirmed === 'לא ידוע' || g.confirmed === 'ממתין';
      return matchesSearch && isPending && g.notes && g.notes.trim() !== '';
    }
    if (activeFilter === 'unknownEmpty') {
      const isPending = !g.confirmed || g.confirmed === '' || g.confirmed === 'לא ידוע' || g.confirmed === 'ממתין';
      return matchesSearch && isPending && (!g.notes || g.notes.trim() === '');
    }
    if (activeFilter === 'noNote') return matchesSearch && (!g.notes || g.notes.trim() === '');
    return matchesSearch;
  });

  const toggleGuest = (id: number) => {
    setSelectedGuests(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
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

  const sendSMS = () => {
    if (selectedGuests.length === 0) return alert("לא בחרת מוזמנים");
    localStorage.setItem('selectedForSMS', JSON.stringify(selectedGuests));
    window.location.href = `/event/${eventId}/sms`;
  };

  const sendWhatsApp = () => {
    if (selectedGuests.length === 0) return alert("לא בחרת מוזמנים");
    localStorage.setItem('selectedForWhatsApp', JSON.stringify(selectedGuests));
    window.location.href = `/event/${eventId}/whatsapp-templates`;
  };

  return (
    <div className="min-h-screen bg-zinc-50" dir="rtl">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-gray-800">
              {eventId === "1" ? "מנהל" : eventTitle}
            </div>
          </div>

          {/* סמלים */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mt-6">
            {[
              { href: "/", label: "עמוד הבית", icon: "🏠" },
              { href: "/videos", label: "וידאו האירוע", icon: "🎥" },
              { href: "/gallery", label: "תמונות האירוע", icon: "🖼" },
              { href: `/event/${eventId}/groups`, label: "קבוצות מוזמנים", icon: "👥" },
              { href: "/venue", label: "רשומות WAZE", icon: "📍" },
              { href: `/add-guests?eventId=${eventId}`, label: "הוספת מוזמנים", icon: "➕" },
              { href: "/seating-arrival", label: "הושבת מוזמנים", icon: "🪑" },
              { href: "/seating-arrival-fast", label: "הושבה מהירה", icon: "⚡" },
              { href: "/guests-arrived", label: "אורחים שהגיעו", icon: "✅" },
              { href: "/addtable", label: "הוספת שולחנות", icon: "➕" },
              { href: "/pricing", label: "הצעות מחיר", icon: "💰" },
              { href: "/pricing-view", label: "צפייה בהצעות", icon: "👀" },
              { href: "/events", label: "רשימת אירועים", icon: "📅" },
              { href: `/event/${eventId}/edit`, label: "עריכת אירוע", icon: "✏️" },
              { href: `/event/${eventId}/sms`, label: "SMS", icon: "📩" },
              { href: `/event/${eventId}/whatsapp-templates`, label: "תבניות ווטסאפ", icon: "💬" },
              { href: "/transport?eventId=1", label: "הסעות", icon: "🚌" },
              { href: `/seating`, label: "סקיצה אולם", icon: "🪑" },
              { href: "/create-event", label: "פתח אירוע חדש", icon: "➕" },
            ].map((item, index) => (
              <Link key={index} href={item.href} className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-center">
                <div className="text-4xl">{item.icon}</div>
                <div className="text-sm font-medium text-gray-700">{item.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* כותרת + כפתור ספירה */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-3xl font-bold">רשימת מוזמנים</div>
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-3 rounded-3xl shadow-lg flex items-center gap-3">
            <div className="text-sm opacity-90">סה"כ אישרו</div>
            <div className="text-4xl font-bold">{totalConfirmedPeople}</div>
          </div>
        </div>

        {/* 5 כפתורי סינון */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={() => setActiveFilter('all')} className={`px-6 py-3 rounded-2xl font-medium text-sm transition-all ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
            כל המוזמנים ({guests.length})
          </button>
          <button onClick={() => setActiveFilter('yes')} className={`px-6 py-3 rounded-2xl font-medium text-sm transition-all ${activeFilter === 'yes' ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
            יגיעו ({yesCount})
          </button>
          <button onClick={() => setActiveFilter('no')} className={`px-6 py-3 rounded-2xl font-medium text-sm transition-all ${activeFilter === 'no' ? 'bg-red-600 text-white' : 'bg-red-500 text-white hover:bg-red-600'}`}>
            לא יגיעו ({noCount})
          </button>
          <button onClick={() => setActiveFilter('unknown')} className={`px-6 py-3 rounded-2xl font-medium text-sm transition-all ${activeFilter === 'unknown' ? 'bg-gray-700 text-white' : 'bg-gray-500 text-white hover:bg-gray-600'}`}>
            לא ידוע ({unknownWithNoteCount})
          </button>
          <button onClick={() => setActiveFilter('unknownEmpty')} className={`px-6 py-3 rounded-2xl font-medium text-sm transition-all ${activeFilter === 'unknownEmpty' ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
            לא ידוע ({unknownEmptyCount})
          </button>
        </div>

        {/* חיפוש + SMS + ווטסאפ + מחק */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input type="text" placeholder="חיפוש..." className="flex-1 p-4 border border-gray-300 rounded-2xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button onClick={sendSMS} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-medium hover:bg-blue-700">📩 SMS</button>
          <button onClick={sendWhatsApp} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-medium hover:bg-green-700">💬 ווטסאפ</button>
          <button onClick={deleteSelected} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-medium hover:bg-red-700">🗑 מחק מסומנים</button>
        </div>

        {/* טבלה */}
        <div className="bg-white rounded-3xl shadow overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-5 text-center w-12"><input type="checkbox" checked={filteredGuests.length > 0 && selectedGuests.length === filteredGuests.length} onChange={toggleSelectAll} className="w-5 h-5 accent-blue-600" /></th>
                <th className="px-6 py-5 text-center">#</th>
                <th className="px-6 py-5 text-center">אירוע</th>
                <th className="px-6 py-5 text-right">שם</th>
                <th className="px-6 py-5 text-right">טלפון</th>
                <th className="px-6 py-5 text-right">קבוצה</th>
                <th className="px-6 py-5 text-center">צפי</th>
                <th className="px-6 py-5 text-center">הסעה</th>
                <th className="px-6 py-5 text-center">סטטוס</th>
                <th className="px-6 py-5 text-center">הערה</th>
                <th className="px-6 py-5 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest: any, index: number) => (
                <tr key={`${guest.id}-${index}`} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-5 text-center"><input type="checkbox" checked={selectedGuests.includes(guest.id)} onChange={() => toggleGuest(guest.id)} className="w-5 h-5 accent-blue-600" /></td>
                  <td className="px-6 py-5 text-center text-gray-500 font-medium">{index + 1}</td>
                  <td className="px-6 py-5 text-center text-blue-600 font-medium">{eventTitle}</td>
                  <td className="px-6 py-5 font-medium">{guest.name}</td>
                  <td className="px-6 py-5 text-gray-600 font-mono">{guest.phone}</td>
                  <td className="px-6 py-5">{guest.group}</td>
                  <td className="px-6 py-5 text-center font-bold">{guest.quantity}</td>
                  <td className="px-6 py-5 text-center font-medium text-blue-600">{guest.transport || '-'}</td>
                  <td className="px-6 py-5 text-center">
                    {guest.confirmed === 'לא מגיע' ? (
                      <div className="flex flex-col items-center"><div className="bg-red-100 text-red-600 w-14 h-14 rounded-2xl flex items-center justify-center text-4xl font-bold">❌</div><div className="text-red-600 font-semibold text-lg mt-1">0</div></div>
                    ) : guest.confirmed && !isNaN(Number(guest.confirmed)) && Number(guest.confirmed) >= 1 ? (
                      <div className="flex flex-col items-center"><div className="bg-emerald-100 text-emerald-700 w-14 h-14 rounded-2xl flex items-center justify-center text-4xl font-bold">✅</div><div className="text-emerald-700 font-semibold text-lg mt-1">{guest.count || guest.quantity || 1}</div></div>
                    ) : (
                      <div className="flex flex-col items-center"><div className="text-4xl">⏳</div><div className="text-amber-600 font-medium text-sm mt-1">ממתין</div></div>
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