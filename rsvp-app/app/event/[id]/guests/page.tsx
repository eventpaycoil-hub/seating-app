'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getGuests, saveGuests } from '../../../lib/guests';

function normalizePhone(raw: string): string {
  if (!raw) return '';
  let p = raw.toString().trim().replace(/[^\d+]/g, '');
  if (p.startsWith('+') && !p.startsWith('+972')) {
    const digits = p.slice(1).replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 15) return '+' + digits;
  }
  if (p.startsWith('+972')) p = p.slice(4);
  else if (p.startsWith('972')) p = p.slice(3);
  p = p.replace(/\D/g, '');
  if (p.length === 9 && p.startsWith('5')) p = '0' + p;
  return p;
}

function isValidPhone(phone: string): boolean {
  if (!phone || !phone.trim()) return true;
  const p = phone.trim();
  if (p.startsWith('+')) {
    const digits = p.slice(1).replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  }
  const local = normalizePhone(p);
  return local.length === 10 && local.startsWith('05');
}

function getPhoneFlag(phone: string): string {
  if (!phone) return '';
  const p = phone.trim();
  if (p.startsWith('05') || p.startsWith('+972') || p.startsWith('972')) return '🇮🇱';
  if (p.startsWith('+1')) return '🇺🇸';
  if (p.startsWith('+44')) return '🇬🇧';
  if (p.startsWith('+33')) return '🇫🇷';
  if (p.startsWith('+49')) return '🇩🇪';
  if (p.startsWith('+39')) return '🇮🇹';
  if (p.startsWith('+34')) return '🇪🇸';
  if (p.startsWith('+7')) return '🇷🇺';
  if (p.startsWith('+380')) return '🇺🇦';
  if (p.startsWith('+31')) return '🇳🇱';
  if (p.startsWith('+32')) return '🇧🇪';
  if (p.startsWith('+41')) return '🇨🇭';
  if (p.startsWith('+43')) return '🇦🇹';
  if (p.startsWith('+48')) return '🇵🇱';
  if (p.startsWith('+90')) return '🇹🇷';
  if (p.startsWith('+20')) return '🇪🇬';
  if (p.startsWith('+962')) return '🇯🇴';
  if (p.startsWith('+961')) return '🇱🇧';
  if (p.startsWith('+970')) return '🇵🇸';
  if (p.startsWith('+')) return '🌐';
  return '';
}

export default function GuestsPage() {
  const params = useParams();
  const rawId = params.id;
  const eventId = String(Array.isArray(rawId) ? rawId[0] : rawId || '1');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<number[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState(`אירוע #${eventId}`);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'yes' | 'no' | 'unknown' | 'unknownEmpty' | 'noNote'
  >('all');
  const [transportOptions, setTransportOptions] = useState<any[]>([]);
  const [hasSeparation, setHasSeparation] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);
  const [visibleActions, setVisibleActions] = useState<string[]>([]);
  const [isClientMode, setIsClientMode] = useState(false);
  const [jumpGroup, setJumpGroup] = useState('');

  useEffect(() => {
    if (!eventId) return;
    const allGuests = getGuests(String(eventId));
    setGuests(allGuests.filter((g: any) => g.name && g.name.trim() !== ''));

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

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const clientMode = localStorage.getItem('clientMode') === 'true';
    setIsClientMode(role === 'client' || clientMode);
    const saved = localStorage.getItem(`visibleActions_${eventId}`);
    if (saved) {
      try {
        setVisibleActions(JSON.parse(saved));
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

  const getTransportCount = (optionName: string) =>
    guests.filter((g: any) =>
      (g.transportation || g.transport || '').toString().includes(optionName)
    ).length;

  const countSeparation = () => {
    let men = 0;
    let women = 0;
    guests.forEach((g: any) => {
      const sep = (g.separation || '').toString().trim();
      if (!sep) return;
      if (sep === 'גבר') men += 1;
      else if (sep === 'אישה') women += 1;
      else if (sep === 'זוג') {
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

  const yesCount = guests.filter(
    (g: any) => g.confirmed && !isNaN(Number(g.confirmed)) && Number(g.confirmed) >= 1
  ).length;
  const noCount = guests.filter((g: any) => g.confirmed === 'לא מגיע').length;

  const unknownWithNoteCount = guests.filter((g: any) => {
    const isPending =
      !g.confirmed || g.confirmed === '' || g.confirmed === 'לא ידוע' || g.confirmed === 'ממתין';
    return isPending && g.notes && g.notes.trim() !== '';
  }).length;

  const unknownEmptyCount = guests.filter((g: any) => {
    const isPending =
      !g.confirmed || g.confirmed === '' || g.confirmed === 'לא ידוע' || g.confirmed === 'ממתין';
    return isPending && (!g.notes || g.notes.trim() === '');
  }).length;

  const totalConfirmedPeople = guests
    .filter((g: any) => g.confirmed && !isNaN(Number(g.confirmed)) && Number(g.confirmed) >= 1)
    .reduce((sum, g) => sum + (Number(g.count) || Number(g.quantity) || 1), 0);

  const filteredGuests = guests.filter((g: any) => {
    const matchesSearch =
      (g.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.phone || '').includes(searchTerm);
    if (activeFilter === 'yes')
      return matchesSearch && g.confirmed && !isNaN(Number(g.confirmed)) && Number(g.confirmed) >= 1;
    if (activeFilter === 'no') return matchesSearch && g.confirmed === 'לא מגיע';
    if (activeFilter === 'unknown') {
      const isPending =
        !g.confirmed || g.confirmed === '' || g.confirmed === 'לא ידוע' || g.confirmed === 'ממתין';
      return matchesSearch && isPending && g.notes && g.notes.trim() !== '';
    }
    if (activeFilter === 'unknownEmpty') {
      const isPending =
        !g.confirmed || g.confirmed === '' || g.confirmed === 'לא ידוע' || g.confirmed === 'ממתין';
      return matchesSearch && isPending && (!g.notes || g.notes.trim() === '');
    }
    if (activeFilter === 'noNote') return matchesSearch && (!g.notes || g.notes.trim() === '');
    return matchesSearch;
  });

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredGuests.forEach((g) => {
      const key = (g.group && String(g.group).trim()) || 'ללא קבוצה';
      if (!map[key]) map[key] = [];
      map[key].push(g);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], 'he'));
  }, [filteredGuests]);

  const allGroupNames = useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g: any) => {
      const key = (g.group && String(g.group).trim()) || 'ללא קבוצה';
      set.add(key);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'he'));
  }, [guests]);

  const scrollToGroup = (groupName: string) => {
    setJumpGroup(groupName);
    if (!groupName) return;
    setTimeout(() => {
      const el = document.getElementById(`group-header-${groupName}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const isConfirmedGuest = (g: any) =>
    g.confirmed && !isNaN(Number(g.confirmed)) && Number(g.confirmed) >= 1;

  const toggleGuest = (id: number) => {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length && filteredGuests.length > 0) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map((g: any) => g.id));
    }
  };

  const toggleGroup = (groupGuests: any[]) => {
    const ids = groupGuests.map((g) => g.id);
    const allIn = ids.length > 0 && ids.every((id) => selectedGuests.includes(id));
    if (allIn) setSelectedGuests((prev) => prev.filter((id) => !ids.includes(id)));
    else setSelectedGuests((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const deleteSelected = () => {
    if (selectedGuests.length === 0) return alert('לא בחרת מוזמנים');
    if (!confirm(`למחוק ${selectedGuests.length} מוזמנים?`)) return;
    const updated = guests.filter((g: any) => !selectedGuests.includes(g.id));
    saveGuests(eventId, updated);
    setGuests(updated);
    setSelectedGuests([]);
  };

  const sendSMS = () => {
    if (selectedGuests.length === 0) return alert('לא בחרת מוזמנים');
    localStorage.setItem('selectedForSMS', JSON.stringify(selectedGuests));
    window.location.href = `/event/${eventId}/sms`;
  };

  const sendWhatsApp = () => {
    if (selectedGuests.length === 0) return alert('לא בחרת מוזמנים');
    localStorage.setItem('selectedForWhatsApp', JSON.stringify(selectedGuests));

    const first = guests.find((g: any) => g.id === selectedGuests[0]);
    const qs = first?.phone
      ? `?phone=${encodeURIComponent(first.phone)}&guestId=${encodeURIComponent(String(first.id))}`
      : '';

    window.location.href = `/event/${eventId}/whatsapp-templates${qs}`;
  };

  const baseCols = isClientMode ? 9 : 10;
  const colSpan = baseCols + (hasTransport ? 1 : 0) + (hasSeparation ? 1 : 0);
    return (
    <div className="min-h-screen bg-zinc-50" dir="rtl">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="text-xl font-bold text-gray-800">
            {eventId === '1' ? 'מנהל' : eventTitle}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mt-6">
            {[
              { id: 'home', href: '/', label: 'עמוד הבית', icon: '🏠' },
              { id: 'fix-phones', href: `/event/${eventId}/fix-phones`, label: 'תיקון מספרים', icon: '📞' },
              { id: 'video', href: `/videos?eventId=${eventId}`, label: 'וידאו האירוע', icon: '🎥' },
              { id: 'photo', href: `/gallery?eventId=${eventId}`, label: 'תמונות האירוע', icon: '🖼' },
              { id: 'groups', href: `/event/${eventId}/groups`, label: 'קבוצות מוזמנים', icon: '👥' },
              { id: 'guests-arrived', href: `/event/${eventId}/guests-arrived`, label: 'אורחים שהגיעו', icon: '✅' },
              { id: 'tables-status', href: `/event/${eventId}/tables-status`, label: 'מצב שולחנות נוכחי', icon: '🪑' },
              { id: 'waze', href: '/venue', label: 'רשומות WAZE', icon: '📍' },
              { id: 'add-guests', href: `/add-guests?eventId=${eventId}`, label: 'הוספת מוזמנים', icon: '➕' },
              { id: 'seating', href: `/event/${eventId}/seating-arrival`, label: 'הושבת מוזמנים', icon: '🪑' },
              { id: 'fast-seating', href: `/event/${eventId}/seating-arrival-fast`, label: 'הושבה מהירה', icon: '⚡' },
              { id: 'duplicate-phones', href: `/event/${eventId}/duplicate-phones`, label: 'מספרים כפולים', icon: '🔁' },
              { id: 'add-tables', href: '/addtable', label: 'הוספת שולחנות', icon: '➕' },
              { id: 'pricing', href: '/pricing', label: 'הצעות מחיר', icon: '💰' },
              { id: 'pricing-view', href: '/pricing-view', label: 'צפייה בהצעות', icon: '👀' },
              { id: 'events-list', href: '/events', label: 'רשימת אירועים', icon: '📅' },
              { id: 'edit-event', href: `/event/${eventId}/edit`, label: 'עריכת אירוע', icon: '✏️' },
              { id: 'sms', href: `/event/${eventId}/sms`, label: 'SMS', icon: '📩' },
              { id: 'whatsapp', href: `/event/${eventId}/whatsapp-templates`, label: 'תבניות ווטסאפ', icon: '💬' },
              { id: 'landing', href: `/landing?eventId=${eventId}`, label: 'דף נחיתה', icon: '🌐' },
              { id: 'whatsapp-manage', href: `/event/${eventId}/whatsapp-templates/manage`, label: 'ניהול תבניות ווטסאפ', icon: '⚙️' },
              { id: 'transport', href: `/transport?eventId=${eventId}`, label: 'הסעות', icon: '🚌' },
              { id: 'seating-sketch', href: `/event/${eventId}/seating`, label: 'סקיצה אולם', icon: '🪑' },
              { id: 'new-event', href: '/create-event', label: 'פתח אירוע חדש', icon: '➕' },
              { id: 'admin-settings', href: `/event/${eventId}/admin-settings`, label: 'הגדרות מנהל', icon: '🔐' },
            ]
              .filter((item) => {
                if (item.id === 'fix-phones' || item.id === 'duplicate-phones') return true;
                if (!isClientMode) return true;
                if (item.id === 'admin-settings') return false;
                return visibleActions.includes(item.id);
              })
              .map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-center"
                >
                  <div className="text-4xl">{item.icon}</div>
                  <div className="text-sm font-medium text-gray-700">{item.label}</div>
                </Link>
              ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="text-3xl font-bold text-slate-800">רשימת מוזמנים</div>
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-3 rounded-3xl shadow-lg flex items-center gap-3">
            <div className="text-sm opacity-90">סה״כ אישרו</div>
            <div className="text-4xl font-bold">{totalConfirmedPeople}</div>
          </div>
        </div>

        {hasTransport && (
          <div className="flex flex-wrap gap-3 mb-6">
            {transportOptions
              .filter((opt) => opt.name && opt.name.trim() !== '' && !opt.name.includes('עצמאית'))
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
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">{count}</span>
                  </div>
                );
              })}
          </div>
        )}

        {hasSeparation && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-2xl font-medium flex items-center gap-3">
              <span className="text-2xl">👨</span>
              <span className="text-lg">גברים</span>
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-lg font-bold">{menCount}</span>
            </div>
            <div className="bg-pink-50 border border-pink-200 text-pink-800 px-6 py-4 rounded-2xl font-medium flex items-center gap-3">
              <span className="text-2xl">👩</span>
              <span className="text-lg">נשים</span>
              <span className="bg-pink-600 text-white px-4 py-1 rounded-full text-lg font-bold">{womenCount}</span>
            </div>
          </div>
        )}

        {/* סינון סטטוס — משמאל */}
        <div className="flex flex-wrap gap-3 mb-4 justify-start">
          {[
            { key: 'all', label: `כל המוזמנים (${guests.length})`, active: 'bg-blue-600', idle: 'bg-blue-500 hover:bg-blue-600' },
            { key: 'yes', label: `יגיעו (${yesCount})`, active: 'bg-emerald-600', idle: 'bg-emerald-500 hover:bg-emerald-600' },
            { key: 'no', label: `לא יגיעו (${noCount})`, active: 'bg-red-600', idle: 'bg-red-500 hover:bg-red-600' },
            { key: 'unknown', label: `לא ידוע (${unknownWithNoteCount})`, active: 'bg-gray-700', idle: 'bg-gray-500 hover:bg-gray-600' },
            { key: 'unknownEmpty', label: `לא ידוע (${unknownEmptyCount})`, active: 'bg-orange-600', idle: 'bg-orange-500 hover:bg-orange-600' },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setActiveFilter(btn.key as any)}
              className={`px-5 py-2.5 rounded-2xl font-medium text-sm text-white transition-all ${
                activeFilter === btn.key ? btn.active : btn.idle
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* חיפוש + כפתורי פעולה */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur py-4 border-b mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <input
                type="text"
                placeholder="חיפוש לפי שם או טלפון..."
                className="flex-1 p-4 border-2 border-slate-200 rounded-2xl focus:border-blue-400 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {!isClientMode && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={sendSMS} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-medium hover:bg-blue-700 whitespace-nowrap">
                    📩 SMS
                  </button>
                  <button onClick={sendWhatsApp} className="bg-green-600 text-white px-6 py-4 rounded-2xl font-medium hover:bg-green-700 whitespace-nowrap">
                    💬 ווטסאפ
                  </button>
                  <button onClick={deleteSelected} className="bg-red-600 text-white px-6 py-4 rounded-2xl font-medium hover:bg-red-700 whitespace-nowrap">
                    🗑 מחק
                  </button>
                </div>
              )}
            </div>

            {/* גלילת קבוצות — בין חיפוש לכפתורים / מתחת לחיפוש */}
            {allGroupNames.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-600 whitespace-nowrap">קבוצות:</span>
                <div className="flex-1 overflow-x-auto pb-1">
                  <div className="flex gap-2 min-w-max">
                    {allGroupNames.map((name) => (
                      <button
                        key={name}
                        onClick={() => scrollToGroup(name)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${
                          jumpGroup === name
                            ? 'bg-amber-500 text-white border-amber-600 shadow'
                            : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* טבלה */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-slate-200">
                  {!isClientMode && (
                    <th className="px-4 py-4 text-center w-12 text-xs font-bold text-slate-700 border border-slate-300">
                      <input
                        type="checkbox"
                        checked={filteredGuests.length > 0 && selectedGuests.length === filteredGuests.length}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 accent-blue-600"
                      />
                    </th>
                  )}
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 border border-slate-300">#</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 border border-slate-300">אירוע</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-slate-700 border border-slate-300">שם</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-slate-700 border border-slate-300">טלפון</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-slate-700 border border-slate-300">קבוצה</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 border border-slate-300">צפי</th>
                  {hasTransport && (
                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 border border-slate-300">הסעה</th>
                  )}
                  {hasSeparation && (
                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 border border-slate-300">מגדר</th>
                  )}
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 border border-slate-300">סטטוס</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 border border-slate-300">הערה</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 border border-slate-300">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {grouped.length === 0 && (
                  <tr>
                    <td colSpan={colSpan} className="py-16 text-center text-gray-400 text-lg border border-slate-200">
                      אין מוזמנים להצגה
                    </td>
                  </tr>
                )}

                {grouped.map(([groupName, groupGuests]) => {
                  const groupIds = groupGuests.map((g) => g.id);
                  const groupAllSelected =
                    groupIds.length > 0 && groupIds.every((id) => selectedGuests.includes(id));
                  const confirmedInGroup = groupGuests
                    .filter(isConfirmedGuest)
                    .reduce((sum, g) => sum + (Number(g.count) || Number(g.quantity) || 1), 0);

                  return (
                    <>
                      <tr key={`header-${groupName}`} id={`group-header-${groupName}`}>
                        {!isClientMode && (
                          <td className="bg-amber-200 border border-amber-300 px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={groupAllSelected}
                              onChange={() => toggleGroup(groupGuests)}
                              className="w-5 h-5 accent-amber-700"
                            />
                          </td>
                        )}
                        <td
                          colSpan={isClientMode ? colSpan : colSpan - 1}
                          className="bg-amber-200 border border-amber-300 px-4 py-3 text-center font-bold text-lg text-amber-950"
                        >
                          {groupName}
                        </td>
                      </tr>

                      {groupGuests.map((guest: any, index: number) => {
                        const transportDisplay = getTransportDisplay(guest);
                        const isWaitingForTransport = transportDisplay === 'לא השיב לשאלת ההסעה';
                        const phone = guest.phone || '';
                        const phoneValid = isValidPhone(phone);
                        const flag = getPhoneFlag(phone);
                        const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-100';

                        return (
                          <tr key={`${guest.id}-${index}`} className={`${rowBg} hover:bg-blue-50`}>
                            {!isClientMode && (
                              <td className="px-4 py-3.5 text-center border border-slate-200">
                                <input
                                  type="checkbox"
                                  checked={selectedGuests.includes(guest.id)}
                                  onChange={() => toggleGuest(guest.id)}
                                  className="w-5 h-5 accent-blue-600"
                                />
                              </td>
                            )}
                            <td className="px-4 py-3.5 text-center text-slate-500 font-medium border border-slate-200">{index + 1}</td>
                            <td className="px-4 py-3.5 text-center text-blue-700 font-medium border border-slate-200">{eventTitle}</td>
                            <td className="px-4 py-3.5 font-semibold text-slate-900 border border-slate-200">{guest.name}</td>
                            <td className="px-4 py-3.5 border border-slate-200">
                              {!phone.trim() ? (
                                <span className="text-slate-300">—</span>
                              ) : (
                                <div>
                                  <div className={`flex items-center gap-2 font-mono ${!phoneValid ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>
                                    {flag && <span>{flag}</span>}
                                    <span dir="ltr">{phone}</span>
                                  </div>
                                  {!phoneValid && <div className="text-[11px] text-red-500 mt-0.5">מס לא תקין</div>}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 border border-slate-200">{guest.group}</td>
                            <td className="px-4 py-3.5 text-center font-bold text-slate-900 border border-slate-200">{guest.quantity}</td>
                            {hasTransport && (
                              <td className={`px-4 py-3.5 text-center font-medium border border-slate-200 ${isWaitingForTransport ? 'text-orange-600' : 'text-blue-700'}`}>
                                {transportDisplay}
                              </td>
                            )}
                            {hasSeparation && (
                              <td className="px-4 py-3.5 text-center font-medium text-purple-700 border border-slate-200">
                                {guest.separation || '-'}
                              </td>
                            )}
                            <td className="px-4 py-3.5 text-center border border-slate-200">
                              {guest.confirmed === 'לא מגיע' ? (
                                <div className="inline-flex flex-col items-center">
                                  <div className="bg-red-100 text-red-600 w-11 h-11 rounded-xl flex items-center justify-center text-xl">❌</div>
                                  <div className="text-red-600 font-bold text-sm mt-1">0</div>
                                </div>
                              ) : guest.confirmed && !isNaN(Number(guest.confirmed)) && Number(guest.confirmed) >= 1 ? (
                                <div className="inline-flex flex-col items-center">
                                  <div className="bg-emerald-100 text-emerald-700 w-11 h-11 rounded-xl flex items-center justify-center text-xl">✅</div>
                                  <div className="text-emerald-700 font-bold text-sm mt-1">{guest.count || guest.quantity || 1}</div>
                                </div>
                              ) : (
                                <div className="inline-flex flex-col items-center">
                                  <div className="text-xl">⏳</div>
                                  <div className="text-amber-600 font-medium text-xs mt-1">ממתין</div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 border border-slate-200">{guest.notes}</td>
                            <td className="px-4 py-3.5 text-center border border-slate-200">
                              <div className="flex gap-2 justify-center">
                                <Link
                                  href={`/event/${eventId}/guests/${guest.id}/edit`}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                                >
                                  ✏️ ערוך
                                </Link>
                                {!isClientMode && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`למחוק את ${guest.name}?`)) {
                                        const updated = guests.filter((g: any) => g.id !== guest.id);
                                        saveGuests(eventId, updated);
                                        setGuests(updated);
                                      }
                                    }}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-sm font-medium border border-rose-200"
                                  >
                                    🗑 מחק
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      <tr key={`footer-${groupName}`}>
                        <td colSpan={colSpan} className="px-4 py-2.5 bg-slate-200 border border-slate-300 text-left text-slate-700 text-sm font-medium">
                          סה״כ אורחים שאישרו בקבוצה:{' '}
                          <span className="text-emerald-700 font-bold text-base">{confirmedInGroup}</span>
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}