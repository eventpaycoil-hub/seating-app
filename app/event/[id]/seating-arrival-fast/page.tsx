// @ts-nocheck
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, RefreshCw, Printer, ArrowLeft, UserPlus, QrCode } from 'lucide-react';
import { loadGuests, updateGuestInSupabase } from '../../../../lib/guests';
import { saveSeating } from '../../../../lib/seating';
import { enqueueGuestUpdate, flushSyncQueue, getPendingCount } from '../../../../lib/offlineSync';

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
  const [isListening, setIsListening] = useState(false);

  const [selectedTableId, setSelectedTableId] = useState<string | number>('');
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [filterTableNum, setFilterTableNum] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const tableMap = useMemo(() => {
    const map = new Map<string, number>();
    try {
      const saved =
        localStorage.getItem(`seatingTables_${eventId}`) ||
        localStorage.getItem('seatingTables');
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
  }, [tableMapVersion, eventId]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'seatingTables' || e.key === `seatingTables_${eventId}`) {
        setTableMapVersion((prev) => prev + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [eventId]);

  useEffect(() => {
    const onOnline = () => {
      flushSyncQueue(updateGuestInSupabase).then((res) => {
        if (res.ok > 0) console.log('auto-synced', res);
      });
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length < 2) return;
    if (forceEmptyList) return;

    const t = setTimeout(() => {
      searchInputRef.current?.blur();
    }, 450);

    return () => clearTimeout(t);
  }, [searchTerm, forceEmptyList]);

  useEffect(() => {
    if (!eventId) return;

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId);
    if (currentEvent) {
      setEventTitle(currentEvent.owners || currentEvent.title || '');
    }

    let cancelled = false;

    (async () => {
      try {
        const list = await loadGuests(String(eventId));
        if (!cancelled && Array.isArray(list)) {
          setAllGuests(list);
        }
      } catch (e) {
        console.log('loadGuests error', e);
        if (!cancelled) {
          const local = JSON.parse(
            localStorage.getItem(`guests_event_${eventId}`) || '[]'
          );
          setAllGuests(local);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    const tick = async () => {
      try {
        const list = await loadGuests(String(eventId));
        if (Array.isArray(list) && list.length > 0) {
          setAllGuests(list);
        }
      } catch (e) {
        console.log('poll guests', e);
      }
    };

    const id = setInterval(tick, 1800000);
    return () => clearInterval(id);
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
    let list = allGuests;

    if (filterTableNum != null) {
      const namesOnTable = new Set<string>();
      try {
        const raw =
          localStorage.getItem(`seatingTables_${eventId}`) ||
          localStorage.getItem('seatingTables') ||
          '[]';
        const seatingData = JSON.parse(raw);
        const table = (Array.isArray(seatingData) ? seatingData : []).find(
          (t: any) => Number(t.tableNumber) === Number(filterTableNum)
        );
        if (table && Array.isArray(table.assignedGuests)) {
          table.assignedGuests.forEach((n: string) => {
            if (n) namesOnTable.add(String(n).trim().toLowerCase());
          });
        }
      } catch {}
      return list.filter((g: any) =>
        namesOnTable.has(String(g.name || '').trim().toLowerCase())
      );
    }

    if (forceEmptyList) return [];
    if (!searchTerm.trim()) return allGuests;

    const term = searchTerm.toLowerCase().trim();
    return list.filter(
      (g: any) =>
        g.name?.toLowerCase().includes(term) || g.phone?.includes(searchTerm.trim())
    );
  }, [allGuests, searchTerm, forceEmptyList, filterTableNum, tableMapVersion, eventId]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setForceEmptyList(false);
    if (term.trim().length >= 2) {
      setFilterTableNum(null);
      setSelectedIds([]);
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('הדפדפן לא תומך בזיהוי קול');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript?.trim() || '';
      if (transcript) {
        handleSearch(transcript);
        searchInputRef.current?.focus();
      }
    };

    recognition.start();
  };

  const markArrival = async (id: number, count: number) => {
    const updated = allGuests.map((guest) => {
      if (guest.id !== id) return guest;

      const status = String(guest.confirmed ?? '').trim();
      const wasNotConfirmed =
        status === 'לא מגיע' ||
        status === 'לא ידוע' ||
        status === 'ממתין' ||
        status === '' ||
        !(Number(status) > 0);

      if (count > 0 && wasNotConfirmed) {
        return {
          ...guest,
          arrivedCount: count,
          confirmed: String(count),
          confirmedCount: count,
          count: count,
          confirmedSource: guest.confirmedSource || 'arrival',
          confirmedAt: new Date().toISOString(),
        };
      }

      return { ...guest, arrivedCount: count };
    });
    setAllGuests(updated);

    const arrivedOnly = updated
      .filter((g) => Number(g.arrivedCount) > 0)
      .map((g) => ({
        id: g.id,
        name: g.name,
        arrivedCount: Number(g.arrivedCount) || 0,
      }));
    localStorage.setItem(`arrived_event_${eventId}`, JSON.stringify(arrivedOnly));
    localStorage.setItem(`guests_event_${eventId}`, JSON.stringify(updated));

    const guest = updated.find((g) => g.id === id);
    if (guest) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        enqueueGuestUpdate(String(eventId), guest);
      } else {
        try {
          await updateGuestInSupabase(guest, String(eventId));
        } catch (e) {
          console.warn('arrival sync failed', e);
          enqueueGuestUpdate(String(eventId), guest);
        }
      }
    }

    if (filterTableNum == null) {
      setSearchTerm('');
      setForceEmptyList(true);
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  };

  const toggleSelect = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllOnTable = () => {
    const ids = filteredGuests
      .filter((g) => !(Number(g.arrivedCount) > 0))
      .map((g) => g.id);
    setSelectedIds(ids);
  };

  const clearSelection = () => setSelectedIds([]);

  const markSelectedArrived = async () => {
    if (selectedIds.length === 0) return;

    const updated = allGuests.map((guest) => {
      if (!selectedIds.includes(guest.id)) return guest;
      if (Number(guest.arrivedCount) > 0) return guest;

      const status = String(guest.confirmed ?? '').trim();
      const confirmedQty =
        Number(guest.confirmedCount) ||
        (Number(status) > 0 ? Number(status) : 0) ||
        Number(guest.quantity) ||
        1;

      const wasNotConfirmed =
        status === 'לא מגיע' ||
        status === 'לא ידוע' ||
        status === 'ממתין' ||
        status === '' ||
        !(Number(status) > 0);

      if (wasNotConfirmed) {
        return {
          ...guest,
          arrivedCount: confirmedQty,
          confirmed: String(confirmedQty),
          confirmedCount: confirmedQty,
          count: confirmedQty,
          confirmedSource: guest.confirmedSource || 'arrival',
          confirmedAt: new Date().toISOString(),
        };
      }

      return { ...guest, arrivedCount: confirmedQty };
    });

    setAllGuests(updated);

    const arrivedOnly = updated
      .filter((g) => Number(g.arrivedCount) > 0)
      .map((g) => ({
        id: g.id,
        name: g.name,
        arrivedCount: Number(g.arrivedCount) || 0,
      }));
    localStorage.setItem(`arrived_event_${eventId}`, JSON.stringify(arrivedOnly));
    localStorage.setItem(`guests_event_${eventId}`, JSON.stringify(updated));

    for (const id of selectedIds) {
      const guest = updated.find((g) => g.id === id);
      if (!guest) continue;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        enqueueGuestUpdate(String(eventId), guest);
      } else {
        try {
          await updateGuestInSupabase(guest, String(eventId));
        } catch (e) {
          console.warn('bulk arrival sync failed', e);
          enqueueGuestUpdate(String(eventId), guest);
        }
      }
    }

    setSelectedIds([]);
  };

  const removeFromTable = async (guestName: string, tableNum: number) => {
    if (!confirm(`להוציא את ${guestName} משולחן ${tableNum}?`)) return;
    try {
      const keyEvent = `seatingTables_${eventId}`;
      const raw =
        localStorage.getItem(keyEvent) ||
        localStorage.getItem('seatingTables') ||
        '[]';
      const tables: any[] = JSON.parse(raw);
      const idx = tables.findIndex((t) => Number(t.tableNumber) === Number(tableNum));
      if (idx < 0) {
        alert('השולחן לא נמצא');
        return;
      }
      const table = { ...tables[idx] };
      const nameKey = String(guestName).trim().toLowerCase();
      table.assignedGuests = (table.assignedGuests || []).filter(
        (n: string) => String(n).trim().toLowerCase() !== nameKey
      );
      if (table.guestSeats) {
        const gs = { ...table.guestSeats };
        Object.keys(gs).forEach((k) => {
          if (String(k).trim().toLowerCase() === nameKey) delete gs[k];
        });
        table.guestSeats = gs;
      }
      tables[idx] = table;
      localStorage.setItem(keyEvent, JSON.stringify(tables));
      localStorage.setItem('seatingTables', JSON.stringify(tables));
      try {
        await saveSeating(eventId, tables);
      } catch (e) {
        console.warn('saveSeating failed', e);
      }
      setTableMapVersion((v) => v + 1);
    } catch (e) {
      console.error(e);
      alert('לא הצלחתי להוציא מהשולחן');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setForceEmptyList(false);
    setFilterTableNum(null);
    setSelectedIds([]);
  };

  const refresh = () => {
    setSearchTerm('');
    setForceEmptyList(false);
    setTableMapVersion((prev) => prev + 1);
  };

  const openAddModal = () => {
    try {
      const raw =
        localStorage.getItem(`seatingTables_${eventId}`) ||
        localStorage.getItem('seatingTables') ||
        '[]';
      const tables = JSON.parse(raw).filter(
        (t: any) => !t.isSpecial && Number(t.seats) > 0
      );
      setAvailableTables(tables);
    } catch {
      setAvailableTables([]);
    }
    setSelectedTableId('');
    setNewName('');
    setNewQty(1);
    setShowAddModal(true);
  };

  const addLiveGuest = async (assignToTable = false) => {
    const name = newName.trim();
    if (!name) {
      alert('נא להזין שם');
      return;
    }

    const qty = Math.min(5, Math.max(1, Number(newQty) || 1));

    const newGuest = {
      id: Date.now(),
      name,
      phone: '',
      quantity: String(qty),
      confirmed: String(qty),
      confirmedCount: qty,
      arrivedCount: qty,
      notes: assignToTable ? 'נוסף בלייב + הושבה' : 'נוסף בלייב – ללא הושבה',
      group: 'כללי',
      transportation: '',
      customerExpectation: '',
    };

    const updated = [...allGuests, newGuest];
    setAllGuests(updated);
    localStorage.setItem(`guests_event_${eventId}`, JSON.stringify(updated));

    try {
      await updateGuestInSupabase(newGuest, String(eventId));
    } catch (e) {
      console.warn('add live guest sync failed', e);
      enqueueGuestUpdate(String(eventId), newGuest);
    }

    if (assignToTable && selectedTableId) {
      try {
        const keyEvent = `seatingTables_${eventId}`;
        const raw =
          localStorage.getItem(keyEvent) ||
          localStorage.getItem('seatingTables') ||
          '[]';
        const tables: any[] = JSON.parse(raw);

        const tableIndex = tables.findIndex(
          (t) => String(t.id) === String(selectedTableId)
        );

        if (tableIndex < 0) {
          alert('השולחן שנבחר לא נמצא');
        } else {
          const table = { ...tables[tableIndex] };
          const assignedGuests = [...(table.assignedGuests || [])];
          const guestSeats = { ...(table.guestSeats || {}) };

          let currentOccupied = 0;
          for (const n of assignedGuests) {
            const q = Number(guestSeats[n]);
            currentOccupied += Number.isFinite(q) && q > 0 ? q : 1;
          }

          const currentSeats = Number(table.seats) || 0;
          const free = currentSeats - currentOccupied;

          if (free < qty) {
            table.seats = currentSeats + (qty - Math.max(0, free));
          }

          if (!assignedGuests.includes(name)) {
            assignedGuests.push(name);
          }
          guestSeats[name] = qty;

          table.assignedGuests = assignedGuests;
          table.guestSeats = guestSeats;
          tables[tableIndex] = table;

          localStorage.setItem(keyEvent, JSON.stringify(tables));
          localStorage.setItem('seatingTables', JSON.stringify(tables));

          try {
            await saveSeating(eventId, tables);
          } catch (e) {
            console.warn('saveSeating failed', e);
          }

          setTableMapVersion((v) => v + 1);
        }
      } catch (err) {
        console.error('שגיאה בהושבה לשולחן', err);
        alert('האורח נוסף, אבל ההושבה לשולחן נכשלה');
      }
    }

    setShowAddModal(false);
    setSelectedTableId('');
    setNewName('');
    setNewQty(1);
    setForceEmptyList(false);
    setSearchTerm(name);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const printPage = () => {
    let seatingData: any[] = [];
    try {
      seatingData = JSON.parse(
        localStorage.getItem(`seatingTables_${eventId}`) ||
          localStorage.getItem('seatingTables') ||
          '[]'
      );
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
    const renderGuestActions = (guest: any) => {
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
    return { confirmed, isAlreadyArrived, isNotComing, isPending, tableNum };
  };

  const emptyHint =
    filterTableNum != null
      ? filteredGuests.length === 0
        ? `אין מוזמנים בשולחן ${filterTableNum}`
        : ''
      : forceEmptyList
      ? 'הרשימה נוקתה. חפש מוזמן חדש...'
      : 'לא נמצאו תוצאות';

  return (
    <div className="min-h-screen bg-[#f5e8c7] p-4 sm:p-6 md:p-8 overflow-x-hidden" dir="rtl">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-4 sm:mb-6">
          <Link
            href={`/event/${eventId}/guests`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
          >
            <ArrowLeft size={20} /> חזרה לרשימת המוזמנים
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 text-amber-900">
          הושבה מהירה {eventTitle && `• ${eventTitle}`}
        </h1>

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="bg-white px-2 py-2 sm:px-3 sm:py-3 rounded-xl shadow text-center">
            <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 leading-tight">אישרו</div>
            <div className="text-lg sm:text-2xl font-bold text-blue-600 tabular-nums">{confirmedPeople}</div>
          </div>
          <div className="bg-white px-2 py-2 sm:px-3 sm:py-3 rounded-xl shadow text-center">
            <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 leading-tight">הגיעו</div>
            <div className="text-lg sm:text-2xl font-bold text-green-600 tabular-nums">{arrivedCount}</div>
          </div>
          <div className="bg-white px-2 py-2 sm:px-3 sm:py-3 rounded-xl shadow text-center">
            <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 leading-tight">עדיין לא הגיעו</div>
            <div className="text-lg sm:text-2xl font-bold text-orange-500 tabular-nums">{stillNotArrived}</div>
          </div>
        </div>

        {/* חיפוש + כפתורים */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-10 sm:justify-center">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[280px] sm:max-w-xl lg:max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="חיפוש שם או טלפון..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-16 py-4 sm:py-5 bg-white border border-gray-300 rounded-2xl sm:rounded-3xl text-base sm:text-xl focus:outline-none focus:border-amber-600"
            />
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-xl transition ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
              title="חיפוש קולי"
            >
              🎤
            </button>
          </div>

          <button
            onClick={clearSearch}
            className="bg-white px-4 sm:px-6 py-3 sm:py-5 rounded-2xl sm:rounded-3xl shadow hover:bg-gray-100 font-medium text-sm sm:text-base"
          >
            נקה
          </button>
          <button
            onClick={refresh}
            className="bg-white px-4 sm:px-6 py-3 sm:py-5 rounded-2xl sm:rounded-3xl shadow hover:bg-gray-100 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
          >
            <RefreshCw size={18} /> רענן שולחנות
          </button>
          <button
            type="button"
            onClick={async () => {
              const res = await flushSyncQueue(updateGuestInSupabase);
              if (res.offline) {
                alert('אין רשת — הסנכרון יידחה');
                return;
              }
              alert(
                res.pending === 0
                  ? `✅ סונכרן: ${res.ok} שינויים`
                  : `סונכרן ${res.ok}, נשארו ${res.pending} בתור`
              );
            }}
            className="bg-indigo-600 text-white px-4 sm:px-6 py-3 sm:py-5 rounded-2xl sm:rounded-3xl shadow hover:bg-indigo-700 font-medium text-sm sm:text-base"
          >
            ☁ סנכרן
            {getPendingCount() > 0 ? ` (${getPendingCount()})` : ''}
          </button>
          <button
            onClick={printPage}
            className="bg-amber-600 text-white px-4 sm:px-6 py-3 sm:py-5 rounded-2xl sm:rounded-3xl shadow hover:bg-amber-700 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
          >
            <Printer size={18} /> PDF
          </button>
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-5 rounded-2xl sm:rounded-3xl shadow hover:bg-blue-700 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
          >
            <UserPlus size={18} /> הוסף מוזמן
          </button>
          <Link
            href={`/event/${eventId}/checkin?from=seating-arrival-fast`}
            className="bg-emerald-600 text-white px-4 sm:px-6 py-3 sm:py-5 rounded-2xl sm:rounded-3xl shadow hover:bg-emerald-700 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
          >
            <QrCode size={18} /> סריקת כניסה
          </Link>
        </div>

        {filterTableNum != null && (
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <div className="font-bold text-amber-900">
                שולחן {filterTableNum} · {filteredGuests.length} מוזמנים
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterTableNum(null);
                  setSelectedIds([]);
                }}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                הצג הכל
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={selectAllOnTable}
                className="px-3 py-1.5 rounded-xl border border-amber-300 text-sm font-medium bg-white hover:bg-amber-50"
              >
                בחר את כולם
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-1.5 rounded-xl border border-gray-300 text-sm font-medium bg-white hover:bg-gray-50"
              >
                נקה בחירה
              </button>
              <button
                type="button"
                onClick={markSelectedArrived}
                disabled={selectedIds.length === 0}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                אשר הגעה למסומנים ({selectedIds.length})
              </button>
            </div>
          </div>
        )}

        {/* מובייל: כרטיסים */}
        <div className="md:hidden space-y-3">
          {filteredGuests.length > 0 ? (
            filteredGuests.map((guest: any) => {
              const {
                confirmed,
                isAlreadyArrived,
                isNotComing,
                isPending,
                tableNum,
              } = renderGuestActions(guest);

              return (
                <div
                  key={guest.id}
                  className="bg-white rounded-2xl shadow border border-amber-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2">
                      {filterTableNum != null && (
                        <input
                          type="checkbox"
                          className="mt-1 w-5 h-5 accent-emerald-600"
                          checked={selectedIds.includes(guest.id)}
                          onChange={() => toggleSelect(guest.id)}
                          disabled={Number(guest.arrivedCount) > 0}
                        />
                      )}
                      <div>
                        <div className="font-bold text-lg text-slate-900">{guest.name}</div>
                        <div className="text-gray-600 font-mono text-sm" dir="ltr">
                          {guest.phone || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {tableNum ? (
                        <button
                          type="button"
                          onClick={() => setFilterTableNum(Number(tableNum))}
                          className="text-amber-700 font-bold text-sm whitespace-nowrap underline underline-offset-2"
                        >
                          שולחן {tableNum}
                        </button>
                      ) : (
                        <div className="text-gray-400 text-sm whitespace-nowrap">לא הושב</div>
                      )}
                      {filterTableNum != null && tableNum && (
                        <button
                          type="button"
                          onClick={() => removeFromTable(guest.name, Number(tableNum))}
                          className="text-xs text-red-600 border border-red-300 rounded-full px-2 py-0.5 hover:bg-red-50"
                        >
                          ✕ הוצא מהשולחן
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    {isNotComing ? (
                      <span className="text-red-600 font-semibold text-sm">❌ לא מגיע</span>
                    ) : isPending ? (
                      <span className="text-amber-600 font-medium text-sm">⏳ ממתין</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold text-sm">✅ {confirmed}</span>
                    )}
                    {isAlreadyArrived && (
                      <span className="text-gray-600 text-sm">הגיע {guest.arrivedCount}</span>
                    )}
                  </div>

                  {isAlreadyArrived ? (
                    <div className="flex flex-col gap-2">
                      <div className="bg-gray-400 text-white px-4 py-3 rounded-2xl font-bold text-center">
                        אורח זה כבר הגיע
                      </div>
                      <button
                        onClick={() => markArrival(guest.id, 0)}
                        className="w-full py-3 rounded-2xl border-2 border-red-300 text-red-600 hover:bg-red-50 font-medium"
                      >
                        בטל הגעה
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => markArrival(guest.id, confirmed)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold text-lg"
                      >
                        {confirmed} הגיע
                      </button>
                      <div className="flex gap-2 justify-center flex-wrap">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <button
                            key={num}
                            onClick={() => markArrival(guest.id, num)}
                            className="w-11 h-11 rounded-xl font-bold border-2 bg-white border-gray-300 hover:bg-emerald-50"
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">
              {emptyHint}
            </div>
          )}
        </div>

        {/* טאבלט/מחשב: טבלה */}
        <div className="hidden md:block bg-white rounded-3xl shadow-xl overflow-hidden">
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
                  const {
                    confirmed,
                    isAlreadyArrived,
                    isNotComing,
                    isPending,
                    tableNum,
                  } = renderGuestActions(guest);

                  return (
                    <tr key={guest.id} className="border-b hover:bg-amber-50">
                      <td className="py-6 px-8">
                        <div className="flex items-start gap-3">
                          {filterTableNum != null && (
                            <input
                              type="checkbox"
                              className="mt-1 w-5 h-5 accent-emerald-600"
                              checked={selectedIds.includes(guest.id)}
                              onChange={() => toggleSelect(guest.id)}
                              disabled={Number(guest.arrivedCount) > 0}
                            />
                          )}
                          <div>
                            <div className="font-semibold text-xl">{guest.name}</div>
                            <div className="text-gray-600 font-mono">{guest.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-center font-bold text-xl text-amber-700">
                        {tableNum ? (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setFilterTableNum(Number(tableNum))}
                              className="underline underline-offset-2 hover:text-amber-900"
                            >
                              שולחן {tableNum}
                            </button>
                            {filterTableNum != null && (
                              <button
                                type="button"
                                onClick={() => removeFromTable(guest.name, Number(tableNum))}
                                className="text-xs text-red-600 border border-red-300 rounded-full px-2 py-0.5 hover:bg-red-50 font-medium"
                              >
                                ✕ הוצא
                              </button>
                            )}
                          </div>
                        ) : (
                          'אורח לא הושב'
                        )}
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
                            <div className="text-emerald-700 font-semibold text-lg mt-1">
                              {confirmed}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-6 px-8 text-center">
                        {isAlreadyArrived ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="bg-gray-400 text-white px-8 py-4 rounded-3xl font-bold text-2xl shadow">
                              אורח זה כבר הגיע
                            </div>
                            <div className="text-gray-600 font-semibold">
                              הגיע {guest.arrivedCount}
                            </div>
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
                    {emptyHint}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">הוסף מוזמן</h2>

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
              className="w-full border rounded-2xl px-4 py-3 mb-5 text-lg"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium mb-2">שייך לשולחן (אופציונלי)</label>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 mb-8 text-lg"
            >
              <option value="">— ללא הושבה —</option>
              {availableTables
                .sort((a, b) => Number(a.tableNumber) - Number(b.tableNumber))
                .map((t) => {
                  const occupied = (t.assignedGuests || []).reduce(
                    (sum: number, name: string) => sum + (t.guestSeats?.[name] ?? 1),
                    0
                  );
                  const free = t.seats - occupied;
                  return (
                    <option key={t.id} value={t.id}>
                      שולחן {t.tableNumber}
                      {t.tableName ? ` (${t.tableName})` : ''} — {occupied}/{t.seats}
                      {free <= 0 ? ' (מלא)' : ` (פנויים ${free})`}
                    </option>
                  );
                })}
            </select>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedTableId('');
                }}
                className="flex-1 py-3 border rounded-2xl font-medium"
              >
                ביטול
              </button>

              <button
                onClick={() => addLiveGuest(false)}
                className="flex-1 py-3 bg-slate-600 text-white rounded-2xl font-bold"
              >
                ללא הושבה
              </button>

              <button
                onClick={() => addLiveGuest(true)}
                disabled={!selectedTableId}
                className={`flex-1 py-3 rounded-2xl font-bold text-white ${
                  selectedTableId
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-300 cursor-not-allowed'
                }`}
              >
                הושב לשולחן
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}