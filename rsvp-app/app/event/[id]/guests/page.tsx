'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useParams } from 'next/navigation';
import { getGuests, saveGuests } from '../../../lib/guests';

export default function GuestsPage() {
  const params = useParams();
  const rawId = params.id;
  const eventId = String(Array.isArray(rawId) ? rawId[0] : rawId || "1");

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<number[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState(`אירוע #${eventId}`);
  const [activeFilter, setActiveFilter] = useState<'all' | 'yes' | 'no' | 'unknown' | 'unknownEmpty' | 'noNote'>('all');
  const [transportOptions, setTransportOptions] = useState<any[]>([]);
  const [hasSeparation, setHasSeparation] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const allGuests = getGuests(String(eventId));
    const validGuests = allGuests.filter(
      (g: any) => g.name && g.name.trim() !== '' && g.phone && g.phone.trim() !== ''
    );
    setGuests(validGuests);

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) {
      setEventTitle(currentEvent.owners || currentEvent.title || `אירוע #${eventId}`);
      setHasSeparation(currentEvent.hasSeparation === 'כן');
      setHasTransport(currentEvent.hasTransport === 'כן');
    }

    const savedTransport = localStorage.getItem(`transport_options_${eventId}`);
    if (savedTransport) {
      try {
        setTransportOptions(JSON.parse(savedTransport));
      } catch {}
    }
  }, [eventId]);

  const getTransportDisplay = (guest: any) => {
    const value = (guest.transportation || guest.transport || '').toString().trim();
    if (!value) return '-';
    const markers = ['*', 'כן', 'הסעה', 'yes', '1', 'true'];
    if (markers.includes(value.toLowerCase()) || value.length <= 3) {
      return 'לא השיב לשאלת ההסעה';
    }
    return value;
  };

  const getTransportCount = (optionName: string) => {
    return guests.filter((g: any) => {
      const value = (g.transportation || g.transport || '').toString();
      return value.includes(optionName);
    }).length;
  };

  const countSeparation = () => {
    let men = 0;
    let women = 0;
    guests.forEach((g: any) => {
      const sep = (g.separation || '').toString().trim();
      if (!sep) return;
      if (sep === 'גבר') {
        men += 1;
      } else if (sep === 'אישה') {
        women += 1;
      } else if (sep === 'זוג') {
        men += 1;
        women += 1;
      } else {
        const menMatch = sep.match(/(\d+)\s*גבר/);
        const womenMatch = sep.match(/(\d+)\s*איש/);
        if (menMatch) men += parseInt(menMatch[1]);
        if (womenMatch) women += parseInt(womenMatch[1]);
      }
    });
    return { men, women };
  };

  const { men: menCount, women: womenCount } = countSeparation();

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
    const updated = guests.filter((g: any) => !selectedGuests.includes(g.id));
    saveGuests(eventId, updated);
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

 const [visibleActions, setVisibleActions] = useState<string[]>([]);
const [isClientMode, setIsClientMode] = useState(false);

useEffect(() => {
  const role = localStorage.getItem('userRole');
  const clientMode = localStorage.getItem('clientMode') === 'true';
  setIsClientMode(role === 'client' || clientMode);

  const saved = localStorage.getItem(`visibleActions_${eventId}`);
  if (saved) {
    setVisibleActions(JSON.parse(saved));
  }
}, [eventId]);

return (
    <div className="min-h-screen bg-zinc-50" dir="rtl">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-gray-800">
              {eventId === "1" ? "מנהל" : eventTitle}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mt-6">
            {[
              { id: 'home', href: "/", label: "עמוד הבית", icon: "🏠" },
              { id: 'video', href: "/videos", label: "וידאו האירוע", icon: "🎥" },
              { id: 'photo', href: "/gallery", label: "תמונות האירוע", icon: "🖼" },
              { id: 'groups', href: `/event/${eventId}/groups`, label: "קבוצות מוזמנים", icon: "👥" },
              { id: 'waze', href: "/venue", label: "רשומות WAZE", icon: "📍" },
              { id: 'add-guests', href: `/add-guests?eventId=${eventId}`, label: "הוספת מוזמנים", icon: "➕" },
              { id: 'seating', href: `/event/${eventId}/seating-arrival`, label: "הושבת מוזמנים", icon: "🪑" },
              { id: 'fast-seating', href: `/event/${eventId}/seating-arrival-fast`, label: "הושבה מהירה", icon: "⚡" },
              { id: 'arrived', href: "/guests-arrived", label: "אורחים שהגיעו", icon: "✅" },
              { id: 'add-tables', href: "/addtable", label: "הוספת שולחנות", icon: "➕" },
              { id: 'pricing', href: "/pricing", label: "הצעות מחיר", icon: "💰" },
              { id: 'pricing-view', href: "/pricing-view", label: "צפייה בהצעות", icon: "👀" },
              { id: 'events-list', href: "/events", label: "רשימת אירועים", icon: "📅" },
              { id: 'edit-event', href: `/event/${eventId}/edit`, label: "עריכת אירוע", icon: "✏️" },
              { id: 'sms', href: `/event/${eventId}/sms`, label: "SMS", icon: "📩" },
              { id: 'whatsapp', href: `/event/${eventId}/whatsapp-templates`, label: "תבניות ווטסאפ", icon: "💬" },
              { id: 'landing', href: `/landing?eventId=${eventId}`, label: "דף נחיתה", icon: "🌐" },
              { id: 'whatsapp-manage', href: `/event/${eventId}/whatsapp-templates/manage`, label: "ניהול תבניות ווטסאפ", icon: "⚙️" },
              { id: 'transport', href: `/transport?eventId=${eventId}`, label: "הסעות", icon: "🚌" },
              { id: 'seating-sketch', href: `/event/${eventId}/seating`, label: "סקיצה אולם", icon: "🪑" },
              { id: 'new-event', href: "/create-event", label: "פתח אירוע חדש", icon: "➕" },
              { id: 'admin-settings', href: `/event/${eventId}/admin-settings`, label: "הגדרות מנהל", icon: "🔐" },
            ]
            .filter((item) => {
              if (!isClientMode) return true;
              if (item.id === 'admin-settings') return false;
              return visibleActions.includes(item.id);
            })
            .map((item, index) => (
              <Link key={index} href={item.href} className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-center">
                <div className="text-4xl">{item.icon}</div>
                <div className="text-sm font-medium text-gray-700">{item.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex items-center gap-4 mb-6">
          <div className="text-3xl font-bold">רשימת מוזמנים</div>
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-3 rounded-3xl shadow-lg flex items-center gap-3">
            <div className="text-sm opacity-90">סה"כ אישרו</div>
            <div className="text-4xl font-bold">{totalConfirmedPeople}</div>
          </div>
        </div>

        {/* ===== סיכום הסעות – רק אם מסומן ===== */}
        {hasTransport && (
          <div className="flex flex-wrap gap-3 mb-6">
            {transportOptions
              .filter(opt => opt.name && opt.name.trim() !== '' && !opt.name.includes('עצמאית'))
              .map((opt) => {
                const count = getTransportCount(opt.name);
                if (count === 0) return null;
                return (
                  <div
                    key={opt.id}
                    className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-5 py-3 rounded-2xl font-medium text-sm flex items-center gap-2"
                  >
                    <span className="text-lg">🚌</span>
                    <span>{opt.name}</span>
                    {opt.time && <span className="text-indigo-500">({opt.time})</span>}
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {count}
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {/* ===== סיכום הפרדה – רק אם מסומן ===== */}
        {hasSeparation && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-2xl font-medium flex items-center gap-3">
              <span className="text-2xl">👨</span>
              <span className="text-lg">גברים</span>
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-lg font-bold">
                {menCount}
              </span>
            </div>
            <div className="bg-pink-50 border border-pink-200 text-pink-800 px-6 py-4 rounded-2xl font-medium flex items-center gap-3">
              <span className="text-2xl">👩</span>
              <span className="text-lg">נשים</span>
              <span className="bg-pink-600 text-white px-4 py-1 rounded-full text-lg font-bold">
                {womenCount}
              </span>
            </div>
          </div>
        )}

        {/* כפתורי סינון */}
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

        {/* חיפוש + כפתורים */}
        <div className="sticky top-0 z-50 bg-white py-4 border-b shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="חיפוש..." 
              className="flex-1 p-4 border border-gray-300 rounded-2xl" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            {!isClientMode && (
              <>
                <button onClick={sendSMS} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-medium hover:bg-blue-700 whitespace-nowrap">
                  📩 SMS
                </button>
                <button onClick={sendWhatsApp} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-medium hover:bg-green-700 whitespace-nowrap">
                  💬 ווטסאפ
                </button>
                <button onClick={deleteSelected} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-medium hover:bg-red-700 whitespace-nowrap">
                  🗑 מחק מסומנים
                </button>
              </>
            )}
          </div>
        </div>

        {/* טבלה */}
        <div className="bg-white rounded-3xl shadow overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-5 text-center w-12">
                  <input 
                    type="checkbox" 
                    checked={filteredGuests.length > 0 && selectedGuests.length === filteredGuests.length} 
                    onChange={toggleSelectAll} 
                    className="w-5 h-5 accent-blue-600" 
                  />
                </th>
                <th className="px-6 py-5 text-center">#</th>
                <th className="px-6 py-5 text-center">אירוע</th>
                <th className="px-6 py-5 text-right">שם</th>
                <th className="px-6 py-5 text-right">טלפון</th>
                <th className="px-6 py-5 text-right">קבוצה</th>
                <th className="px-6 py-5 text-center">צפי</th>
                {hasTransport && <th className="px-6 py-5 text-center">הסעה</th>}
                {hasSeparation && <th className="px-6 py-5 text-center">מגדר</th>}
                <th className="px-6 py-5 text-center">סטטוס</th>
                <th className="px-6 py-5 text-center">הערה</th>
                <th className="px-6 py-5 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest: any, index: number) => {
                const transportDisplay = getTransportDisplay(guest);
                const isWaitingForTransport = transportDisplay === 'לא השיב לשאלת ההסעה';

                return (
                  <tr key={`${guest.id}-${index}`} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-5 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedGuests.includes(guest.id)} 
                        onChange={() => toggleGuest(guest.id)} 
                        className="w-5 h-5 accent-blue-600" 
                      />
                    </td>
                    <td className="px-6 py-5 text-center text-gray-500 font-medium">{index + 1}</td>
                    <td className="px-6 py-5 text-center text-blue-600 font-medium">{eventTitle}</td>
                    <td className="px-6 py-5 font-medium">{guest.name}</td>
                    <td className="px-6 py-5 text-gray-600 font-mono">{guest.phone}</td>
                    <td className="px-6 py-5">{guest.group}</td>
                    <td className="px-6 py-5 text-center font-bold">{guest.quantity}</td>

                    {hasTransport && (
                      <td className={`px-6 py-5 text-center font-medium ${isWaitingForTransport ? 'text-orange-600' : 'text-blue-600'}`}>
                        {transportDisplay}
                      </td>
                    )}

                    {hasSeparation && (
                      <td className="px-6 py-5 text-center font-medium text-purple-700">
                        {guest.separation || '-'}
                      </td>
                    )}

                    <td className="px-6 py-5 text-center">
                      {guest.confirmed === 'לא מגיע' ? (
                        <div className="flex flex-col items-center">
                          <div className="bg-red-100 text-red-600 w-14 h-14 rounded-2xl flex items-center justify-center text-4xl font-bold">❌</div>
                          <div className="text-red-600 font-semibold text-lg mt-1">0</div>
                        </div>
                      ) : guest.confirmed && !isNaN(Number(guest.confirmed)) && Number(guest.confirmed) >= 1 ? (
                        <div className="flex flex-col items-center">
                          <div className="bg-emerald-100 text-emerald-700 w-14 h-14 rounded-2xl flex items-center justify-center text-4xl font-bold">✅</div>
                          <div className="text-emerald-700 font-semibold text-lg mt-1">{guest.count || guest.quantity || 1}</div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="text-4xl">⏳</div>
                          <div className="text-amber-600 font-medium text-sm mt-1">ממתין</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-gray-600 text-sm">{guest.notes}</td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex gap-2 justify-center">
                        <Link href={`/event/${eventId}/guests/${guest.id}/edit`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-2xl text-sm font-medium">✏️ ערוך</Link>
                        <button 
                          onClick={() => {
                            if (confirm(`למחוק את ${guest.name}?`)) {
                              const updated = guests.filter((g: any) => g.id !== guest.id);
                              saveGuests(eventId, updated);
                              setGuests(updated);
                            }
                          }} 
                          className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-5 py-2 rounded-2xl text-sm font-medium"
                        >
                          🗑 מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}